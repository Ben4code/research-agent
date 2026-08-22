import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createResearchSchema, type CreateResearchRequest } from '@research-agent/shared';

const DEMO_USER_ID = 'demo-user-id';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createResearchSchema))
  create(@Body() dto: CreateResearchRequest) {
    return this.researchService.create(DEMO_USER_ID, dto);
  }

  @Get()
  findAll() {
    return this.researchService.findAll(DEMO_USER_ID);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.researchService.findOne(DEMO_USER_ID, id);
  }
}
