import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Result } from '../entities/result.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Assessment } from '../entities/assessment.entity';
import { Achievement, UserAchievement } from '../entities/achievement.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Result,
      UserProgress,
      Assessment,
      Achievement,
      UserAchievement,
      ModuleEntity,
    ]),
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
