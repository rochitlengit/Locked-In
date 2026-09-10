import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { TimeService } from './time.service';
import { StartTimerDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('time')
export class TimeController {
  constructor(private time: TimeService) {}

  @Post('start')
  start(@CurrentUser() user: any, @Body() dto: StartTimerDto) {
    return this.time.start(user.id, dto);
  }

  @Post(':id/stop')
  stop(@CurrentUser() user: any, @Param('id') id: string) {
    return this.time.stop(user.id, id);
  }

  @Get('active')
  active(@CurrentUser() user: any) {
    return this.time.active(user.id);
  }

  @Get('mine')
  mine(@CurrentUser() user: any) {
    return this.time.myLogs(user.id);
  }

  @Get('task/:taskId')
  forTask(@Param('taskId') taskId: string) {
    return this.time.logsForTask(taskId);
  }
}
