import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement, UserAchievement } from '../entities/achievement.entity';
import { User } from '../entities/user.entity';
import { Result } from '../entities/result.entity';
import { Assessment } from '../entities/assessment.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      User,
      Result,
      Assessment,
      UserProgress,
    ]),
    UsersModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
