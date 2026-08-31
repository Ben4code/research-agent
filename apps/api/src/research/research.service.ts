import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from '../temporal/temporal.service';
import {
  type CreateResearchRequest,
  type Visibility,
} from '@research-agent/shared';
import { generateShareToken } from '../common/share-token';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

const RESEARCH_INCLUDE = {
  sources: {
    orderBy: { retrievedAt: 'desc' },
  },
  findings: {
    include: {
      source: {
        select: { id: true, url: true, title: true },
      },
    },
  },
  reports: {
    orderBy: { createdAt: 'desc' },
  },
} as const;

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporal: TemporalService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateResearchRequest) {
    const research = await this.prisma.research.create({
      data: {
        userId,
        question: dto.question,
        instructions: dto.instructions,
        status: 'pending',
        visibility: 'PUBLIC',
        shareToken: generateShareToken(),
      },
    });

    const workflowId = `research-${research.id}`;

    try {
      await this.temporal.startResearchWorkflow(workflowId, {
        researchId: research.id,
        question: research.question,
        instructions: research.instructions ?? undefined,
      });

      await this.prisma.research.update({
        where: { id: research.id },
        data: { workflowId },
      });

      this.logger.log(`Research ${research.id} → workflow ${workflowId}`);
    } catch (error) {
      this.logger.error(
        `Failed to start workflow for research ${research.id}`,
        error,
      );

      await this.prisma.research.update({
        where: { id: research.id },
        data: { status: 'failed' },
      });

      return {
        id: research.id,
        status: 'failed' as const,
      };
    }

    return {
      id: research.id,
      status: research.status,
    };
  }

  async findAll(userId: string) {
    const items = await this.prisma.research.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: items.map((r) => ({
        id: r.id,
        userId: r.userId,
        question: r.question,
        instructions: r.instructions,
        status: r.status,
        workflowId: r.workflowId,
        visibility: r.visibility,
        shareToken: r.shareToken,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      total: items.length,
    };
  }

  /**
   * Returns a research project. Authenticated users may view any research
   * they own (regardless of visibility) or any research that is PUBLIC.
   */
  async findOne(userId: string, id: string) {
    const research = await this.prisma.research.findFirst({
      where: {
        id,
        OR: [{ userId }, { visibility: 'PUBLIC' }],
      },
      include: RESEARCH_INCLUDE,
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    return research;
  }

  /** Public access by share token — no authentication required. */
  async findByShareToken(token: string) {
    const research = await this.prisma.research.findFirst({
      where: { shareToken: token, visibility: 'PUBLIC' },
      include: RESEARCH_INCLUDE,
    });

    if (!research) {
      throw new NotFoundException('Research not found');
    }

    return research;
  }

  async updateVisibility(userId: string, id: string, visibility: Visibility) {
    const research = await this.prisma.research.findFirst({
      where: { id, userId },
      select: { id: true, shareToken: true },
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    const shareToken =
      visibility === 'PUBLIC'
        ? (research.shareToken ?? generateShareToken())
        : null;

    const updated = await this.prisma.research.update({
      where: { id },
      data: { visibility, shareToken },
    });

    const shareBase = this.config.get<string>(
      'SHARE_URL_BASE',
      this.config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    );

    return {
      id: updated.id,
      visibility: updated.visibility,
      shareToken: updated.shareToken,
      shareUrl:
        updated.visibility === 'PUBLIC' && updated.shareToken
          ? `${shareBase}/research/public/${updated.shareToken}`
          : null,
    };
  }

  async remove(userId: string, id: string) {
    const research = await this.prisma.research.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    // Deleting the research cascades to its events, sources, findings, and
    // reports via the database-level ON DELETE CASCADE relations.
    await this.prisma.research.delete({
      where: { id: research.id },
    });

    return { id: research.id };
  }

  async removeReport(userId: string, researchId: string, reportId: string) {
    const research = await this.prisma.research.findFirst({
      where: { id: researchId, userId },
      select: { id: true },
    });

    if (!research) {
      throw new NotFoundException(`Research ${researchId} not found`);
    }

    const result = await this.prisma.report.deleteMany({
      where: { id: reportId, researchId },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    return { id: reportId };
  }

  /**
   * Streams stored research events over SSE. Polls the database for new
   * events (no external pub/sub needed) and completes when the research
   * reaches a terminal status and all events have been delivered.
   */
  streamEvents(
    userId: string,
    id: string,
  ): Observable<{ data: unknown; id?: string; type?: string }> {
    return new Observable((subscriber) => {
      let lastSequence = 0;
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        subscriber.complete();
      };

      const poll = async () => {
        try {
          const research = await this.prisma.research.findFirst({
            where: {
              id,
              OR: [{ userId }, { visibility: 'PUBLIC' }],
            },
            select: { id: true, status: true },
          });

          if (!research) {
            subscriber.error(new NotFoundException(`Research ${id} not found`));
            close();
            return;
          }

          const events = await this.prisma.researchEvent.findMany({
            where: {
              researchId: id,
              sequence: { gt: lastSequence },
            },
            orderBy: { sequence: 'asc' },
          });

          for (const event of events) {
            lastSequence = event.sequence;
            subscriber.next({
              id: event.id,
              type: event.type,
              data: {
                id: event.id,
                type: event.type,
                researchId: event.researchId,
                step: event.step ?? undefined,
                message: event.message ?? undefined,
                metadata: event.metadata ?? undefined,
                timestamp: event.timestamp.toISOString(),
              },
            });
          }

          // Once the workflow is done and everything has been delivered, end the stream.
          if (TERMINAL_STATUSES.has(research.status)) {
            this.logger.log(
              `Ending event stream for research ${id} (${research.status})`,
            );
            close();
          }
        } catch (error) {
          this.logger.error(
            `Event stream poll failed for research ${id}`,
            error,
          );
          subscriber.error(error);
          close();
        }
      };

      // First poll immediately, then poll on an interval.
      void poll();
      const timer = setInterval(() => void poll(), 1000);

      return () => {
        clearInterval(timer);
      };
    });
  }
}
