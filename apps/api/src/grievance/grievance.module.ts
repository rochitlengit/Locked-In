import { Module } from '@nestjs/common';
import { GrievanceService } from './grievance.service';
import { GrievanceController } from './grievance.controller';

@Module({
  providers: [GrievanceService],
  controllers: [GrievanceController],
})
export class GrievanceModule {}
