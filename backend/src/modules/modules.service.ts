import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(ModuleEntity) private readonly moduleRepo: Repository<ModuleEntity>,
    @InjectRepository(Scenario) private readonly scenarioRepo: Repository<Scenario>,
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(UserProgress) private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async findAll(userId?: string) {
    const modules = await this.moduleRepo.find({ order: { orderIndex: 'ASC' } });

    if (!userId) return modules;

    // Attach user progress to each module
    const result = await Promise.all(
      modules.map(async (mod) => {
        const progress = await this.progressRepo.findOne({
          where: { userId, moduleId: mod.id },
        });

        const totalScenarios = await this.scenarioRepo.count({ where: { moduleId: mod.id } });
        const totalExercises = await this.exerciseRepo.count({ where: { moduleId: mod.id } });
        const totalItems = totalScenarios + totalExercises;

        return {
          ...mod,
          totalItems,
          completedItems: progress?.completedItems ?? 0,
          progress: totalItems > 0 ? Math.round(((progress?.completedItems ?? 0) / totalItems) * 100) : 0,
          avgScore: progress?.avgScore ?? 0,
          status: progress?.status ?? (mod.locked ? 'Próximamente' : 'Sin iniciar'),
        };
      }),
    );

    return result;
  }

  async findOne(id: string) {
    // Support lookup by UUID or by module type (e.g. 'leadership', 'oral', 'written')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const mod = await this.moduleRepo.findOne({
      where: isUuid ? { id } : { type: id as any },
    });
    if (!mod) throw new NotFoundException('Módulo no encontrado');

    const scenarios = await this.scenarioRepo.find({
      where: { moduleId: mod.id },
      order: { orderIndex: 'ASC' },
    });
    const exercises = await this.exerciseRepo.find({
      where: { moduleId: mod.id },
      order: { orderIndex: 'ASC' },
    });

    return { ...mod, scenarios, exercises };
  }

  async getScenario(id: string) {
    const scenario = await this.scenarioRepo.findOne({ where: { id } });
    if (!scenario) throw new NotFoundException('Escenario no encontrado');
    return scenario;
  }

  async getExercise(id: string) {
    const exercise = await this.exerciseRepo.findOne({ where: { id } });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');
    return exercise;
  }
}
