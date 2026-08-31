import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  claimAdminSchema,
  updateVisibilitySchema,
  type ClaimAdminRequest,
} from '@research-agent/shared';
import {
  ClaimAdminDocDto,
  ClaimAdminResponseDocDto,
  AdminResearchListDocDto,
  AdminUsersListDocDto,
  UpdateVisibilityResponseDocDto,
  DeleteResearchResponseDocDto,
  ValidationErrorDocDto,
} from './dto/admin-doc.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('claim')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Promote the current user to admin',
    description:
      'Promotes the authenticated user to an admin role when the correct admin signup code is provided.',
  })
  @ApiResponse({
    status: 201,
    description: 'User promoted to admin',
    type: ClaimAdminResponseDocDto,
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
    status: 403,
    description: 'Invalid admin code',
  })
  claim(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(claimAdminSchema)) dto: ClaimAdminRequest,
  ) {
    return this.adminService.claimAdmin(user.id, dto.code);
  }

  @Get('research')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all research (admin)',
    description:
      'Returns every research project across all users, newest first, with the owning user.',
  })
  @ApiResponse({
    status: 200,
    description: 'All research projects',
    type: AdminResearchListDocDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  listResearch() {
    return this.adminService.listResearch();
  }

  @Get('users')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all users (admin)',
    description:
      'Returns every user account with their research project count.',
  })
  @ApiResponse({
    status: 200,
    description: 'All users',
    type: AdminUsersListDocDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Delete('research/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Delete any research (admin)',
    description:
      'Deletes a research project and cascades to its sources, findings, reports, and events.',
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
    status: 403,
    description: 'Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  remove(@Param('id') id: string) {
    return this.adminService.removeResearch(id);
  }

  @Post('research/:id/visibility')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Set any research visibility (admin)',
    description:
      'Toggles any research project between PUBLIC and PRIVATE, regardless of owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'Research ID',
    example: 'cmt4fnrm40001zv5xags8q27q',
  })
  @ApiResponse({
    status: 200,
    description: 'Visibility updated',
    type: UpdateVisibilityResponseDocDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Research not found',
  })
  updateVisibility(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVisibilitySchema))
    dto: { visibility: 'PRIVATE' | 'PUBLIC' },
  ) {
    return this.adminService.updateVisibility(id, dto.visibility);
  }
}