import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimAdminDocDto {
  @ApiProperty({
    description: 'The admin signup code configured via ADMIN_SIGNUP_CODE',
    example: 'my-secret-admin-code',
  })
  code!: string;
}

export class ClaimAdminResponseDocDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiPropertyOptional({ description: 'User name', nullable: true })
  name?: string | null;

  @ApiProperty({ description: 'User role', example: 'admin' })
  role!: string;
}

export class AdminResearchItemDocDto {
  @ApiProperty({ description: 'Unique research identifier' })
  id!: string;

  @ApiProperty({ description: 'The research question' })
  question!: string;

  @ApiPropertyOptional({ description: 'Additional instructions', nullable: true })
  instructions?: string | null;

  @ApiProperty({ description: 'Current research status' })
  status!: string;

  @ApiProperty({ description: 'Visibility', enum: ['PRIVATE', 'PUBLIC'] })
  visibility!: string;

  @ApiPropertyOptional({ description: 'Share token', nullable: true })
  shareToken?: string | null;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({
    description: 'Owning user',
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string', nullable: true },
      role: { type: 'string' },
    },
  })
  user!: { id: string; email: string; name?: string | null; role: string };
}

export class AdminResearchListDocDto {
  @ApiProperty({ description: 'All research projects', type: [AdminResearchItemDocDto] })
  items!: AdminResearchItemDocDto[];
}

export class AdminUserItemDocDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiPropertyOptional({ description: 'User name', nullable: true })
  name?: string | null;

  @ApiProperty({ description: 'User role', example: 'user' })
  role!: string;

  @ApiProperty({ description: 'When the account was created' })
  createdAt!: string;

  @ApiProperty({ description: 'Research project counts' })
  _count!: { research: number };
}

export class AdminUsersListDocDto {
  @ApiProperty({ description: 'All users', type: [AdminUserItemDocDto] })
  items!: AdminUserItemDocDto[];
}

export class UpdateVisibilityResponseDocDto {
  @ApiProperty({ description: 'Unique research identifier' })
  id!: string;

  @ApiProperty({ description: 'Updated visibility', enum: ['PRIVATE', 'PUBLIC'] })
  visibility!: string;

  @ApiPropertyOptional({ description: 'Share token (present when PUBLIC)', nullable: true })
  shareToken?: string | null;

  @ApiPropertyOptional({ description: 'Full share URL for PUBLIC research', nullable: true })
  shareUrl?: string | null;
}

export class DeleteResearchResponseDocDto {
  @ApiProperty({ description: 'ID of the deleted research' })
  id!: string;
}

export class ValidationErrorDocDto {
  @ApiProperty({ description: 'Error message' })
  message!: string;

  @ApiProperty({
    description: 'Field-level validation errors',
    type: 'array',
    items: { type: 'object' },
  })
  errors!: { field: string; message: string }[];
}