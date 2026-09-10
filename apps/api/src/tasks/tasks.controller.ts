import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  ApproveTaskDto,
  CreateSubtaskDto,
} from './dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Roles('SUPER_ADMIN', 'TEAM_LEAD')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.tasks.createTask(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: any) {
    return this.tasks.listMyTasks(user.id);
  }

  @Roles('SUPER_ADMIN', 'TEAM_LEAD')
  @Get('pending-approvals')
  pendingApprovals(@CurrentUser() user: any) {
    return this.tasks.listPendingApprovals(user.id);
  }

  @Get('team/:teamId')
  listForTeam(@Param('teamId') teamId: string) {
    return this.tasks.listTasksForTeam(teamId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Roles('SUPER_ADMIN', 'TEAM_LEAD')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.updateTask(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasks.updateStatus(id, user.id, dto);
  }

  @Roles('SUPER_ADMIN', 'TEAM_LEAD')
  @Patch(':id/approve')
  approve(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ApproveTaskDto) {
    return this.tasks.approve(id, user.id, dto);
  }

  @Get(':id/subtasks')
  listSubtasks(@Param('id') id: string) {
    return this.tasks.listSubtasks(id);
  }

  @Post(':id/subtasks')
  addSubtask(@Param('id') id: string, @Body() dto: CreateSubtaskDto) {
    return this.tasks.createSubtask(id, dto);
  }

  @Patch('subtasks/:id/status')
  subtaskStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateSubtaskStatus(id, status);
  }
}
