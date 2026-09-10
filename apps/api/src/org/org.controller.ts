import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { OrgService } from './org.service';
import { CreateDepartmentDto, CreateTeamDto, CreateUserDto, UpdateUserDto, CreateRemarkDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OrgController {
  constructor(private org: OrgService) {}

  @Roles('SUPER_ADMIN', 'HR')
  @Post('departments')
  createDepartment(@CurrentUser() user: any, @Body() dto: CreateDepartmentDto) {
    return this.org.createDepartment(user.orgId, dto);
  }

  @Get('departments')
  listDepartments(@CurrentUser() user: any) {
    return this.org.listDepartments(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Post('teams')
  createTeam(@Body() dto: CreateTeamDto) {
    return this.org.createTeam(dto);
  }

  @Get('teams')
  listTeams(@CurrentUser() user: any) {
    return this.org.listTeams(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Post('users')
  createUser(@CurrentUser() user: any, @Body() dto: CreateUserDto) {
    return this.org.createUser(user.orgId, dto);
  }

  @Get('users')
  listUsers(@CurrentUser() user: any) {
    return this.org.listUsers(user.orgId);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.org.getUser(id);
  }

  @Get('teams/:teamId/members')
  teamMembers(@Param('teamId') teamId: string) {
    return this.org.listTeamMembers(teamId);
  }

  @Roles('SUPER_ADMIN', 'HR')
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.org.updateUser(id, dto);
  }

  @Get('org-chart')
  orgChart(@CurrentUser() user: any) {
    return this.org.orgChart(user.orgId);
  }

  @Roles('SUPER_ADMIN', 'HR', 'TEAM_LEAD')
  @Post('remarks')
  addRemark(@CurrentUser() user: any, @Body() dto: CreateRemarkDto) {
    return this.org.addRemark(user.id, dto);
  }

  @Get('remarks/:subjectId')
  listRemarks(@Param('subjectId') subjectId: string) {
    return this.org.listRemarks(subjectId);
  }
}
