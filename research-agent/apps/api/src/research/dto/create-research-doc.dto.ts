import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResearchDocDto {
  @ApiProperty({
    description: 'The research question to investigate',
    example:
      'Compare the top five payment processors available to Canadian SaaS companies',
    maxLength: 2000,
  })
  question!: string;

  @ApiPropertyOptional({
    description: 'Optional additional instructions to guide the research',
    example: 'Focus on pricing, APIs, payment methods, and developer experience',
    maxLength: 2000,
  })
  instructions?: string;
}
