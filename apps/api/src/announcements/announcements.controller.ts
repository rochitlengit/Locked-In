import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcements: AnnouncementsService) {}

  @Roles('SUPER_ADMIN', 'HR')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.announcements.create(user.id, user.orgId, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.announcements.list(user.orgId);
  }
}
