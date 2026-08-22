import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from '../temporal/temporal.service';
import { type CreateResearchRequest } from '@research-agent/shared';

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
}
