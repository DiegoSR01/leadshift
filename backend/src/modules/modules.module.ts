import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Assessment } from '../entities/assessment.entity';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { PretestGuard } from './pretest.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity, Scenario, Exercise, UserProgress, Assessment]),
  ],
  controllers: [ModulesController],
  providers: [ModulesService, PretestGuard],
  exports: [ModulesService],
})
export class ModulesModule {}
