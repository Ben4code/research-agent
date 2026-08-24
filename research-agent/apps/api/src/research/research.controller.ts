import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
  UsePipes,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ResearchService } from './research.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createResearchSchema,
  type CreateResearchRequest,
} from '@research-agent/shared';
import { CreateResearchDocDto } from './dto/create-research-doc.dto';
import {
  ResearchResponseDocDto,
  ResearchListResponseDocDto,
  ResearchDetailDocDto,
  ValidationErrorDocDto,
} from './dto/research-doc.dto';

const DEMO_USER_ID = 'demo-user-id';

@ApiTags('Research')
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a research project',
    description:
      'Creates a new research project, starts a Temporal workflow, and returns the research ID with its initial status.',
  })
  @ApiBody({
    description: 'Research question and optional instructions',
    type: CreateResearchDocDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Research created and workflow started',
    type: ResearchResponseDocDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed — question is required or exceeds max length',
    type: ValidationErrorDocDto,
  })
  @UsePipes(new ZodValidationPipe(createResearchSchema))
  create(@Body() dto: CreateResearchRequest) {
    return this.researchService.create(DEMO_USER_ID, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all research projects',
    description:
      'Returns all research projects for the current user, ordered by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of research projects',
    type: ResearchListResponseDocDto,
  })
  findAll() {
    return this.researchService.findAll(DEMO_USER_ID);
  }

  @Sse(':id/events')
  @ApiOperation({
    summary: 'Stream research progress events (SSE)',
    description:
      'Opens a Server-Sent Events stream of stored research events. The stream delivers all historical events immediately, then pushes new events as the workflow produces them, and closes when the research reaches a terminal status (completed/failed).',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiResponse({
    status: 200,
    description: 'Server-Sent Events stream',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  streamEvents(
    @Param('id') id: string,
  ): Observable<{ data: unknown; id?: string; type?: string }> {
    return this.researchService.streamEvents(DEMO_USER_ID, id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get research detail',
    description:
      'Returns a single research project with its sources, findings, and reports.',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiResponse({
    status: 200,
    description: 'Research detail with sources, findings, and reports',
    type: ResearchDetailDocDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  findOne(@Param('id') id: string) {
    return this.researchService.findOne(DEMO_USER_ID, id);
  }
}
