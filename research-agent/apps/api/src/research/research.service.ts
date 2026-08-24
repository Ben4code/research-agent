import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from '../temporal/temporal.service';
import { type CreateResearchRequest } from '@research-agent/shared';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporal: TemporalService,
  ) {}

  async create(userId: string, dto: CreateResearchRequest) {
    const research = await this.prisma.research.create({
      data: {
        userId,
        question: dto.question,
        instructions: dto.instructions,
        status: 'pending',
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
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      total: items.length,
    };
  }

  async findOne(userId: string, id: string) {
    const research = await this.prisma.research.findFirst({
      where: { id, userId },
      include: {
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
      },
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    return research;
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
            where: { id, userId },
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
