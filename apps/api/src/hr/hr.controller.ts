import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { HrService } from './hr.service';
import { CreateLeaveTypeDto, CreateLeaveRequestDto, DecideLeaveDto, CreatePermissionRequestDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private hr: HrService) {}

  @Roles('SUPER_ADMIN', 'HR')
  @Post('leave-types')
  createLeaveType(@CurrentUser() user: any, @Body() dto: CreateLeaveTypeDto) {
    return this.hr.createLeaveType(user.orgId, dto);
  }

  @Get('leave-types')
  listLeaveTypes(@CurrentUser() user: any) {
    return this.hr.listLeaveTypes(user.orgId);
  }

  @Post('leave-requests')
  requestLeave(@CurrentUser() user: any, @Body() dto: CreateLeaveRequestDto) {
    return this.hr.requestLeave(user.id, dto);
  }

  @Get('leave-requests/mine')
  myLeave(@CurrentUser() user: any) {
    return this.hr.myLeaveRequests(user.id);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Get('leave-requests/pending')
  pendingLeave(@CurrentUser() user: any) {
    return this.hr.pendingLeaveRequests(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Patch('leave-requests/:id/decide')
  decideLeave(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecideLeaveDto) {
    return this.hr.decideLeave(id, user.id, dto);
  }

  @Get('leave-balances/mine')
  myBalances(@CurrentUser() user: any) {
    return this.hr.myBalances(user.id);
  }

  @Post('permission-requests')
  requestPermission(@CurrentUser() user: any, @Body() dto: CreatePermissionRequestDto) {
    return this.hr.requestPermission(user.id, dto);
  }

  @Get('permission-requests/mine')
  myPermission(@CurrentUser() user: any) {
    return this.hr.myPermissionRequests(user.id);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Get('permission-requests/pending')
  pendingPermission(@CurrentUser() user: any) {
    return this.hr.pendingPermissionRequests(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Patch('permission-requests/:id/decide')
  decidePermission(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: DecideLeaveDto) {
    return this.hr.decidePermission(id, user.id, dto);
  }
}
