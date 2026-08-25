import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResearchResponseDocDto {
  @ApiProperty({
    description: 'Unique research identifier',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  id!: string;

  @ApiProperty({
    description: 'Current research status',
    example: 'pending',
    enum: [
      'pending',
      'planning',
      'researching',
      'analyzing',
      'generating_report',
      'completed',
      'failed',
      'waiting_for_user',
    ],
  })
  status!: string;
}

export class ResearchRecordDocDto {
  @ApiProperty({ description: 'Unique research identifier' })
  id!: string;

  @ApiProperty({ description: 'User ID who created the research' })
  userId!: string;

  @ApiProperty({ description: 'The research question' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Optional additional instructions',
    nullable: true,
  })
  instructions?: string | null;

  @ApiProperty({
    description: 'Current research status',
    enum: [
      'pending',
      'planning',
      'researching',
      'analyzing',
      'generating_report',
      'completed',
      'failed',
      'waiting_for_user',
    ],
  })
  status!: string;

  @ApiPropertyOptional({ description: 'Temporal workflow ID', nullable: true })
  workflowId?: string | null;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601)',
    example: '2026-08-22T13:47:45.676Z',
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'Completion timestamp (ISO 8601)',
    nullable: true,
  })
  completedAt?: string | null;
}

export class ResearchListResponseDocDto {
  @ApiProperty({
    description: 'List of research projects',
    type: [ResearchRecordDocDto],
  })
  items!: ResearchRecordDocDto[];

  @ApiProperty({ description: 'Total number of research projects', example: 4 })
  total!: number;
}

export class SourceDocDto {
  @ApiProperty({ description: 'Unique source identifier' })
  id!: string;

  @ApiProperty({ description: 'Research ID this source belongs to' })
  researchId!: string;

  @ApiProperty({
    description: 'Source URL',
    example: 'https://stripe.com/pricing',
  })
  url!: string;

  @ApiProperty({ description: 'Source title', example: 'Stripe Pricing' })
  title!: string;

  @ApiPropertyOptional({ description: 'Full page content', nullable: true })
  content?: string | null;

  @ApiPropertyOptional({
    description: 'Short snippet from the source',
    nullable: true,
  })
  snippet?: string | null;

  @ApiProperty({ description: 'When the source was retrieved (ISO 8601)' })
  retrievedAt!: string;
}

export class FindingDocDto {
  @ApiProperty({ description: 'Unique finding identifier' })
  id!: string;

  @ApiProperty({ description: 'Research ID this finding belongs to' })
  researchId!: string;

  @ApiProperty({ description: 'Source ID this finding was extracted from' })
  sourceId!: string;

  @ApiProperty({
    description: 'The claim or finding extracted from the source',
  })
  claim!: string;

  @ApiPropertyOptional({
    description: 'Supporting evidence for the claim',
    nullable: true,
  })
  evidence?: string | null;

  @ApiPropertyOptional({
    description: 'Confidence level of the finding',
    enum: ['high', 'medium', 'low'],
    nullable: true,
  })
  confidence?: string | null;

  @ApiPropertyOptional({
    description: 'The source this finding was extracted from',
    type: 'object',
    properties: {
      id: { type: 'string' },
      url: { type: 'string' },
      title: { type: 'string' },
    },
  })
  source?: { id: string; url: string; title: string };
}

export class ReportDocDto {
  @ApiProperty({ description: 'Unique report identifier' })
  id!: string;

  @ApiProperty({ description: 'Research ID this report belongs to' })
  researchId!: string;

  @ApiProperty({ description: 'Report title' })
  title!: string;

  @ApiProperty({ description: 'Full report content (Markdown)' })
  content!: string;

  @ApiProperty({ description: 'Report creation timestamp (ISO 8601)' })
  createdAt!: string;
}

export class ResearchDetailDocDto {
  @ApiProperty({ description: 'Unique research identifier' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'The research question' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Additional instructions',
    nullable: true,
  })
  instructions?: string | null;

  @ApiProperty({
    description: 'Current research status',
    enum: [
      'pending',
      'planning',
      'researching',
      'analyzing',
      'generating_report',
      'completed',
      'failed',
      'waiting_for_user',
    ],
  })
  status!: string;

  @ApiPropertyOptional({ description: 'Temporal workflow ID', nullable: true })
  workflowId?: string | null;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'Completion timestamp (ISO 8601)',
    nullable: true,
  })
  completedAt?: string | null;

  @ApiProperty({
    description: 'Sources collected during research',
    type: [SourceDocDto],
  })
  sources!: SourceDocDto[];

  @ApiProperty({
    description: 'Findings extracted during research',
    type: [FindingDocDto],
  })
  findings!: FindingDocDto[];

  @ApiProperty({
    description: 'Reports generated for this research',
    type: [ReportDocDto],
  })
  reports!: ReportDocDto[];
}

export class HealthResponseDocDto {
  @ApiProperty({ description: 'Health status', example: 'ok' })
  status!: string;

  @ApiProperty({ description: 'Service name', example: 'research-agent-api' })
  service!: string;

  @ApiProperty({
    description: 'Current timestamp (ISO 8601)',
    example: '2026-08-22T13:47:45.676Z',
  })
  timestamp!: string;
}

export class DeleteResearchResponseDocDto {
  @ApiProperty({
    description: 'ID of the deleted research',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  id!: string;
}

export class ValidationErrorDocDto {
  @ApiProperty({ description: 'Error message', example: 'Validation failed' })
  message!: string;

  @ApiProperty({
    description: 'Field-level validation errors',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string', example: 'question' },
        message: { type: 'string', example: 'Question is required' },
      },
    },
  })
  errors!: { field: string; message: string }[];
}
