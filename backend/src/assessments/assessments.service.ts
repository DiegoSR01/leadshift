import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../entities/assessment.entity';
import { CreateAssessmentDto } from './dto/assessment.dto';
import { UserProgress } from '../entities/user-progress.entity';
import { Module as ModuleEntity } from '../entities/module.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment) private readonly repo: Repository<Assessment>,
    @InjectRepository(UserProgress) private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(ModuleEntity) private readonly moduleRepo: Repository<ModuleEntity>,
  ) {}

  async create(userId: string, dto: CreateAssessmentDto) {
    // Prevent duplicate assessments of the same type
    const existing = await this.repo.findOne({
      where: { userId, type: dto.type },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un ${dto.type} para este usuario`);
    }

    // Postest is only allowed when all unlocked modules are completed
    if (dto.type === 'postest') {
      const hasPretest = await this.repo.findOne({ where: { userId, type: 'pretest' } });
      if (!hasPretest) {
        throw new ForbiddenException('Debes completar el Pretest antes de realizar el Postest');
      }
      const modules = await this.moduleRepo.find({ where: { locked: false } });
      const progressList = await this.progressRepo.find({ where: { userId } });
      const allCompleted = modules.every((m) =>
        progressList.some((p) => p.moduleId === m.id && p.status === 'Completado'),
      );
      if (!allCompleted) {
        throw new ForbiddenException('Debes completar todos los módulos antes de realizar el Postest');
      }
    }

    const assessment = this.repo.create({ userId, ...dto });
    return this.repo.save(assessment);
  }

  async findByUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { completedAt: 'ASC' } });
  }

  /**
   * Returns pretest vs postest comparison data for dashboard charts.
   */
  async getComparison(userId: string) {
    const assessments = await this.findByUser(userId);
    const pretest = assessments.find((a) => a.type === 'pretest');
    const postest = assessments.find((a) => a.type === 'postest');

    if (!pretest) {
      return { pretest: null, postest: null, improvements: null };
    }

    const improvements: Record<string, { before: number; after: number; change: number }> = {};
    if (pretest && postest) {
      for (const skill of Object.keys(pretest.scores)) {
        const before = pretest.scores[skill] ?? 0;
        const after = postest.scores[skill] ?? 0;
        improvements[skill] = {
          before,
          after,
          change: before > 0 ? Math.round(((after - before) / before) * 100) : 0,
        };
      }
    }

    return {
      pretest: pretest?.scores ?? null,
      postest: postest?.scores ?? null,
      improvements,
    };
  }

  /**
   * Returns pretest / postest completion flags and postest eligibility.
   */
  async getStatus(userId: string) {
    const assessments = await this.findByUser(userId);
    const pretest = assessments.find((a) => a.type === 'pretest');
    const postest = assessments.find((a) => a.type === 'postest');

    let postestEligible = false;
    if (pretest && !postest) {
      const modules = await this.moduleRepo.find({ where: { locked: false } });
      const progressList = await this.progressRepo.find({ where: { userId } });
      postestEligible = modules.every((m) =>
        progressList.some((p) => p.moduleId === m.id && p.status === 'Completado'),
      );
    }

    return {
      pretestCompleted: !!pretest,
      postestCompleted: !!postest,
      postestEligible,
      pretestCompletedAt: pretest?.completedAt ?? null,
      postestCompletedAt: postest?.completedAt ?? null,
    };
  }
}
