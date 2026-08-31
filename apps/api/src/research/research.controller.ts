import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Sse,
  UseGuards,
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
  updateVisibilitySchema,
  type CreateResearchRequest,
} from '@research-agent/shared';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';
import { CreateResearchDocDto } from './dto/create-research-doc.dto';
import { UpdateVisibilityDocDto } from './dto/update-visibility-doc.dto';
import {
  ResearchResponseDocDto,
  ResearchListResponseDocDto,
  ResearchDetailDocDto,
  DeleteResearchResponseDocDto,
  ValidationErrorDocDto,
  UpdateVisibilityResponseDocDto,
} from './dto/research-doc.dto';

@ApiTags('Research')
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  @UseGuards(AuthGuard)
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
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  create(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(createResearchSchema))
    dto: CreateResearchRequest,
  ) {
    return this.researchService.create(user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
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
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  findAll(@CurrentUser() user: SessionUser) {
    return this.researchService.findAll(user.id);
  }

  @Get('public/:token')
  @ApiOperation({
    summary: 'Get public research by share token',
    description:
      'Returns a public research project (sources, findings, reports) without authentication. Only PUBLIC research can be fetched this way.',
  })
  @ApiParam({
    name: 'token',
    description: 'Share token of the public research',
    example: 'abc123...',
  })
  @ApiResponse({
    status: 200,
    description: 'Public research detail',
    type: ResearchDetailDocDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found or not public',
  })
  findByShareToken(@Param('token') token: string) {
    return this.researchService.findByShareToken(token);
  }

  @Sse(':id/events')
  @UseGuards(AuthGuard)
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
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  streamEvents(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
  ): Observable<{ data: unknown; id?: string; type?: string }> {
    return this.researchService.streamEvents(user.id, id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get research detail',
    description:
      'Returns a single research project with its sources, findings, and reports. Accessible by the owner, or by any authenticated user when the research is PUBLIC.',
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
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.researchService.findOne(user.id, id);
  }

  @Post(':id/visibility')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set research visibility',
    description:
      'Toggles a research project between PUBLIC (shareable via link) and PRIVATE (owner only). Generating a PUBLIC share token returns the share URL.',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiBody({
    description: 'Visibility to set',
    type: UpdateVisibilityDocDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Visibility updated',
    type: UpdateVisibilityResponseDocDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ValidationErrorDocDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  updateVisibility(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVisibilitySchema))
    dto: { visibility: 'PRIVATE' | 'PUBLIC' },
  ) {
    return this.researchService.updateVisibility(user.id, id, dto.visibility);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete a research project',
    description:
      'Deletes a research project and cascades the deletion to its associated sources, findings, reports, and events.',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiResponse({
    status: 200,
    description: 'Research deleted',
    type: DeleteResearchResponseDocDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.researchService.remove(user.id, id);
  }

  @Delete(':id/reports/:reportId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete a single report',
    description:
      'Deletes a specific report belonging to a research project. Does not affect the research, sources, or findings.',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiParam({
    name: 'reportId',
    description: 'Report ID',
    example: 'cmt4fnrm40002zv5xags8q27q',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted',
    type: DeleteResearchResponseDocDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Research or report not found',
  })
  removeReport(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Param('reportId') reportId: string,
  ) {
    return this.researchService.removeReport(user.id, id, reportId);
  }
}
