import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity, Scenario, Exercise, UserProgress]),
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
