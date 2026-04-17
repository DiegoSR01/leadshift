import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Result } from '../entities/result.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Result, Scenario, Exercise, UserProgress]),
    EvaluationModule,
    GamificationModule,
    UsersModule,
    UsersModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
