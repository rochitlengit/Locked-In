import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  create(authorId: string, orgId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({ data: { authorId, orgId, ...dto } });
  }

  list(orgId: string) {
    return this.prisma.announcement.findMany({
      where: { orgId },
      include: { author: true },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }
}
