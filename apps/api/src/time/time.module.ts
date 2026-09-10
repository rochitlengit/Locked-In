import { Module } from '@nestjs/common';
import { TimeService } from './time.service';
import { TimeController } from './time.controller';

@Module({
  providers: [TimeService],
  controllers: [TimeController],
  exports: [TimeService],
})
export class TimeModule {}
