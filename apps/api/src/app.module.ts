import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrgModule } from './org/org.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeModule } from './time/time.module';
import { HrModule } from './hr/hr.module';
import { GamificationModule } from './gamification/gamification.module';
import { ChatModule } from './chat/chat.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { GrievanceModule } from './grievance/grievance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    OrgModule,
    TasksModule,
    TimeModule,
    HrModule,
    GamificationModule,
    ChatModule,
    AnnouncementsModule,
    GrievanceModule,
  ],
})
export class AppModule {}
