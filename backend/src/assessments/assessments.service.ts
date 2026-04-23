import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../entities/assessment.entity';
import { CreateAssessmentDto } from './dto/assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment) private readonly repo: Repository<Assessment>,
  ) {}

  async create(userId: string, dto: CreateAssessmentDto) {
    // Prevent duplicate assessments of the same type
    const existing = await this.repo.findOne({
      where: { userId, type: dto.type },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un ${dto.type} para este usuario`);
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
}
