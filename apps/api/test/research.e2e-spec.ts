import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TemporalService } from './../src/temporal/temporal.service';

describe('Research API (e2e)', () => {
  let app: INestApplication;

  const mockPrisma = {
    research: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    researchEvent: {
      findMany: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
    source: {
      create: vi.fn(),
    },
    finding: {
      createMany: vi.fn(),
    },
    report: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  const mockTemporal = {
    startResearchWorkflow: vi.fn(),
    onModuleInit: vi.fn(),
    onModuleDestroy: vi.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(TemporalService)
      .useValue(mockTemporal)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('research-agent-api');
    });
  });

  describe('POST /api/research', () => {
    it('should create research and start workflow', async () => {
      const dbResearch = {
        id: 'test-id-1',
        userId: 'demo-user-id',
        question: 'Compare Temporal and BullMQ',
        instructions: 'Focus on NestJS',
        status: 'pending',
        workflowId: null,
        createdAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      };

      mockPrisma.research.create.mockResolvedValue(dbResearch);
      mockTemporal.startResearchWorkflow.mockResolvedValue(
        'research-test-id-1',
      );
      mockPrisma.research.update.mockResolvedValue({
        ...dbResearch,
        workflowId: 'research-test-id-1',
      });

      const response = await request(app.getHttpServer())
        .post('/api/research')
        .send({
          question: 'Compare Temporal and BullMQ',
          instructions: 'Focus on NestJS',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');

      expect(mockPrisma.research.create).toHaveBeenCalledWith({
        data: {
          userId: 'demo-user-id',
          question: 'Compare Temporal and BullMQ',
          instructions: 'Focus on NestJS',
          status: 'pending',
        },
      });

      expect(mockTemporal.startResearchWorkflow).toHaveBeenCalledWith(
        'research-test-id-1',
        {
          researchId: 'test-id-1',
          question: 'Compare Temporal and BullMQ',
          instructions: 'Focus on NestJS',
        },
      );

      expect(mockPrisma.research.update).toHaveBeenCalledWith({
        where: { id: 'test-id-1' },
        data: { workflowId: 'research-test-id-1' },
      });
    });

    it('should create research without instructions', async () => {
      const dbResearch = {
        id: 'test-id-2',
        userId: 'demo-user-id',
        question: 'Best React state management',
        instructions: null,
        status: 'pending',
        workflowId: null,
        createdAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      };

      mockPrisma.research.create.mockResolvedValue(dbResearch);
      mockTemporal.startResearchWorkflow.mockResolvedValue(
        'research-test-id-2',
      );
      mockPrisma.research.update.mockResolvedValue(dbResearch);

      const response = await request(app.getHttpServer())
        .post('/api/research')
        .send({ question: 'Best React state management' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should return 400 when question is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/research')
        .send({ question: '' })
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('question');
    });

    it('should return 400 when question is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/research')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should strip unknown fields', async () => {
      const dbResearch = {
        id: 'test-id-3',
        userId: 'demo-user-id',
        question: 'Test question',
        instructions: null,
        status: 'pending',
        workflowId: null,
        createdAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      };

      mockPrisma.research.create.mockResolvedValue(dbResearch);
      mockTemporal.startResearchWorkflow.mockResolvedValue(
        'research-test-id-3',
      );
      mockPrisma.research.update.mockResolvedValue(dbResearch);

      await request(app.getHttpServer())
        .post('/api/research')
        .send({ question: 'Test question', bogusField: true })
        .expect(201);

      expect(mockPrisma.research.create).toHaveBeenCalledWith({
        data: {
          userId: 'demo-user-id',
          question: 'Test question',
          instructions: undefined,
          status: 'pending',
        },
      });
    });

    it('should mark research as failed if workflow start fails', async () => {
      const dbResearch = {
        id: 'test-id-4',
        userId: 'demo-user-id',
        question: 'Test question',
        instructions: null,
        status: 'pending',
        workflowId: null,
        createdAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      };

      mockPrisma.research.create.mockResolvedValue(dbResearch);
      mockTemporal.startResearchWorkflow.mockRejectedValue(
        new Error('Temporal down'),
      );
      mockPrisma.research.update.mockResolvedValue({
        ...dbResearch,
        status: 'failed',
      });

      const response = await request(app.getHttpServer())
        .post('/api/research')
        .send({ question: 'Test question' })
        .expect(201);

      expect(response.body.status).toBe('failed');

      expect(mockPrisma.research.update).toHaveBeenCalledWith({
        where: { id: 'test-id-4' },
        data: { status: 'failed' },
      });
    });
  });

  describe('GET /api/research', () => {
    it('should return list of research projects', async () => {
      const dbItems = [
        {
          id: 'r1',
          userId: 'demo-user-id',
          question: 'Question 1',
          instructions: null,
          status: 'completed',
          workflowId: 'wf-1',
          createdAt: new Date('2026-08-20'),
          completedAt: new Date('2026-08-21'),
          updatedAt: new Date('2026-08-21'),
        },
        {
          id: 'r2',
          userId: 'demo-user-id',
          question: 'Question 2',
          instructions: 'Focus on pricing',
          status: 'researching',
          workflowId: 'wf-2',
          createdAt: new Date('2026-08-22'),
          completedAt: null,
          updatedAt: new Date('2026-08-22'),
        },
      ];

      mockPrisma.research.findMany.mockResolvedValue(dbItems);

      const response = await request(app.getHttpServer())
        .get('/api/research')
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].id).toBe('r1');
      expect(response.body.items[0].question).toBe('Question 1');
      expect(response.body.items[0].status).toBe('completed');
      expect(response.body.items[1].status).toBe('researching');
    });

    it('should return empty list when no research exists', async () => {
      mockPrisma.research.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/research')
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.items).toHaveLength(0);
    });
  });

  describe('GET /api/research/:id', () => {
    it('should return research detail with sources, findings, reports', async () => {
      const dbResearch = {
        id: 'r1',
        userId: 'demo-user-id',
        question: 'Compare payment processors',
        instructions: 'Focus on Canadian SaaS',
        status: 'completed',
        workflowId: 'wf-1',
        createdAt: new Date('2026-08-15'),
        completedAt: new Date('2026-08-16'),
        updatedAt: new Date('2026-08-16'),
        sources: [
          {
            id: 's1',
            researchId: 'r1',
            url: 'https://stripe.com/pricing',
            title: 'Stripe Pricing',
            content: 'Stripe pricing...',
            snippet: '2.9% + 30c',
            retrievedAt: new Date('2026-08-15'),
          },
        ],
        findings: [
          {
            id: 'f1',
            researchId: 'r1',
            sourceId: 's1',
            claim: 'Stripe charges 2.9% + 30c',
            evidence: 'Listed on pricing page',
            confidence: 'high',
            source: {
              id: 's1',
              url: 'https://stripe.com/pricing',
              title: 'Stripe Pricing',
            },
          },
        ],
        reports: [
          {
            id: 'rep1',
            researchId: 'r1',
            title: 'Payment Processors Report',
            content: '# Report content',
            createdAt: new Date('2026-08-16'),
          },
        ],
      };

      mockPrisma.research.findFirst.mockResolvedValue(dbResearch);

      const response = await request(app.getHttpServer())
        .get('/api/research/r1')
        .expect(200);

      expect(response.body.id).toBe('r1');
      expect(response.body.question).toBe('Compare payment processors');
      expect(response.body.sources).toHaveLength(1);
      expect(response.body.findings).toHaveLength(1);
      expect(response.body.reports).toHaveLength(1);
      expect(response.body.findings[0].source.title).toBe('Stripe Pricing');
    });

    describe('GET /api/research/:id/events (SSE)', () => {
      it('should stream stored events and end on terminal status', async () => {
        mockPrisma.research.findFirst.mockResolvedValueOnce({
          id: 'r1',
          status: 'completed',
        });

        const now = new Date();
        mockPrisma.researchEvent.findMany.mockResolvedValue([
          {
            id: 'evt1',
            sequence: 1,
            researchId: 'r1',
            type: 'research.started',
            step: 'initialized',
            message: 'Research workflow started',
            metadata: null,
            timestamp: now,
          },
          {
            id: 'evt2',
            sequence: 2,
            researchId: 'r1',
            type: 'research.completed',
            step: 'completed',
            message: 'Research completed',
            metadata: null,
            timestamp: now,
          },
        ]);

        const response = await request(app.getHttpServer())
          .get('/api/research/r1/events')
          .set('Accept', 'text/event-stream')
          .buffer(true)
          .parse((res, cb) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            res.on('end', () => cb(null, Buffer.concat(chunks).toString()));
          })
          .expect(200);

        const body = response.body as string;

        expect(body).toContain('id: evt1');
        expect(body).toContain('event: research.started');
        expect(body).toContain('"type":"research.started"');
        expect(body).toContain('"message":"Research workflow started"');
        expect(body).toContain('event: research.completed');

        expect(mockPrisma.researchEvent.findMany).toHaveBeenCalled();
      });

      it('should return 404 when research not found', async () => {
        mockPrisma.research.findFirst.mockResolvedValue(null);

        const response = await request(app.getHttpServer())
          .get('/api/research/nonexistent/events')
          .set('Accept', 'text/event-stream')
          .buffer(true)
          .parse((res, cb) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            res.on('end', () => cb(null, Buffer.concat(chunks).toString()));
          })
          .expect(404);

        expect(response.body).toBeDefined();
      });
    });
  });

  describe('DELETE /api/research/:id', () => {
    it('should delete a research project', async () => {
      mockPrisma.research.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.research.delete.mockResolvedValue({ id: 'r1' });

      const response = await request(app.getHttpServer())
        .delete('/api/research/r1')
        .expect(200);

      expect(response.body).toEqual({ id: 'r1' });

      expect(mockPrisma.research.findFirst).toHaveBeenCalledWith({
        where: { id: 'r1', userId: 'demo-user-id' },
        select: { id: true },
      });
      expect(mockPrisma.research.delete).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });
    });

    it('should return 404 when research not found', async () => {
      mockPrisma.research.findFirst.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .delete('/api/research/nonexistent')
        .expect(404);

      expect(response.body).toBeDefined();
      expect(mockPrisma.research.delete).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/research/:id/reports/:reportId', () => {
    it('should delete a single report', async () => {
      mockPrisma.research.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.report.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .delete('/api/research/r1/reports/rep1')
        .expect(200);

      expect(response.body).toEqual({ id: 'rep1' });

      expect(mockPrisma.research.findFirst).toHaveBeenCalledWith({
        where: { id: 'r1', userId: 'demo-user-id' },
        select: { id: true },
      });
      expect(mockPrisma.report.deleteMany).toHaveBeenCalledWith({
        where: { id: 'rep1', researchId: 'r1' },
      });
    });

    it('should return 404 when research not found', async () => {
      mockPrisma.research.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/research/nonexistent/reports/rep1')
        .expect(404);

      expect(mockPrisma.report.deleteMany).not.toHaveBeenCalled();
    });

    it('should return 404 when report not found', async () => {
      mockPrisma.research.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.report.deleteMany.mockResolvedValue({ count: 0 });

      const response = await request(app.getHttpServer())
        .delete('/api/research/r1/reports/rep1')
        .expect(404);

      expect(response.body).toBeDefined();
    });
  });
});
