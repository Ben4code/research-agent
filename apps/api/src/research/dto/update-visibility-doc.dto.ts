import { ApiProperty } from '@nestjs/swagger';

export class UpdateVisibilityDocDto {
  @ApiProperty({
    description: 'Visibility to set for the research project',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PUBLIC',
  })
  visibility!: 'PUBLIC' | 'PRIVATE';
}
