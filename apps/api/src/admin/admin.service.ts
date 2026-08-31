import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { type Visibility } from '@research-agent/shared';
import { generateShareToken } from '../common/share-token';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async claimAdmin(userId: string, code: string) {
    const adminCode = this.config.get<string>('ADMIN_SIGNUP_CODE');
    if (!adminCode || code !== adminCode) {
      throw new ForbiddenException('Invalid admin code');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async listResearch() {
    return this.prisma.research.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { research: true } },
      },
    });
  }

  async removeResearch(id: string) {
    const research = await this.prisma.research.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    await this.prisma.research.delete({ where: { id } });

    return { id };
  }

  async updateVisibility(id: string, visibility: Visibility) {
    const research = await this.prisma.research.findFirst({
      where: { id },
      select: { id: true, shareToken: true },
    });

    if (!research) {
      throw new NotFoundException(`Research ${id} not found`);
    }

    const shareToken =
      visibility === 'PUBLIC'
        ? (research.shareToken ?? generateShareToken())
        : null;

    const updated = await this.prisma.research.update({
      where: { id },
      data: { visibility, shareToken },
    });

    const shareBase = this.config.get<string>(
      'SHARE_URL_BASE',
      this.config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    );

    return {
      id: updated.id,
      visibility: updated.visibility,
      shareToken: updated.shareToken,
      shareUrl:
        updated.visibility === 'PUBLIC' && updated.shareToken
          ? `${shareBase}/research/public/${updated.shareToken}`
          : null,
    };
  }
}