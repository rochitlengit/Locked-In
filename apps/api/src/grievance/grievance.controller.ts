import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { GrievanceService } from './grievance.service';
import { CreateGrievanceDto, UpdateGrievanceDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grievances')
export class GrievanceController {
  constructor(private grievance: GrievanceService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateGrievanceDto) {
    return this.grievance.create(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: any) {
    return this.grievance.myGrievances(user.id);
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Get()
  all(@CurrentUser() user: any) {
    return this.grievance.allForOrg(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrievanceDto) {
    return this.grievance.update(id, dto);
  }
}
