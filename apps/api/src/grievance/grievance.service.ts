import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrievanceDto, UpdateGrievanceDto } from './dto';

@Injectable()
export class GrievanceService {
  constructor(private prisma: PrismaService) {}

  create(raisedById: string, dto: CreateGrievanceDto) {
    return this.prisma.grievance.create({ data: { raisedById, ...dto } });
  }

  myGrievances(raisedById: string) {
    return this.prisma.grievance.findMany({ where: { raisedById }, orderBy: { createdAt: 'desc' } });
  }

  allForOrg(orgId: string) {
    return this.prisma.grievance.findMany({
      where: { raisedBy: { orgId } },
      include: { raisedBy: true, owner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, dto: UpdateGrievanceDto) {
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') data.resolvedAt = new Date();
    return this.prisma.grievance.update({ where: { id }, data });
  }
}
