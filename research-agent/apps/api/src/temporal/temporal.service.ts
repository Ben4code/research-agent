import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Connection,
  type WorkflowClient,
} from '@temporalio/client';
import type { ResearchWorkflowInput } from '@research-agent/shared';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private client: Client | null = null;
  private connection: Connection | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const address = this.configService.get<string>(
      'TEMPORAL_ADDRESS',
      'localhost:7233',
    );
    const namespace = this.configService.get<string>(
      'TEMPORAL_NAMESPACE',
      'default',
    );

    try {
      this.connection = await Connection.connect({ address });
      this.client = new Client({
        connection: this.connection,
        namespace,
      });
      this.logger.log(`Connected to Temporal at ${address} (namespace: ${namespace})`);
    } catch (error) {
      this.logger.error(`Failed to connect to Temporal at ${address}`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.connection?.close();
  }

  get workflow(): WorkflowClient {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }
    return this.client.workflow;
  }

  async startResearchWorkflow(
    workflowId: string,
    input: ResearchWorkflowInput,
  ): Promise<string> {
    const taskQueue = this.configService.get<string>(
      'TEMPORAL_TASK_QUEUE',
      'research-agent',
    );

    const handle = await this.workflow.start('researchWorkflow', {
      workflowId,
      taskQueue,
      args: [input],
    });

    this.logger.log(`Started workflow ${workflowId} on task queue ${taskQueue}`);
    return handle.workflowId;
  }
}
