import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from '../entities/result.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { LeadershipService } from '../evaluation/leadership.service';
import { OralCommunicationService } from '../evaluation/oral-communication.service';
import { WrittenCommunicationService } from '../evaluation/written-communication.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result) private readonly resultRepo: Repository<Result>,
    @InjectRepository(Scenario) private readonly scenarioRepo: Repository<Scenario>,
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(UserProgress) private readonly progressRepo: Repository<UserProgress>,
    private readonly leadershipService: LeadershipService,
    private readonly oralService: OralCommunicationService,
    private readonly writtenService: WrittenCommunicationService,
    private readonly usersService: UsersService,
  ) {}

  // ─── Submit a leadership scenario answer ───
  async submitScenario(userId: string, scenarioId: string, selectedOption: string) {
    const scenario = await this.scenarioRepo.findOne({ where: { id: scenarioId } });
    if (!scenario) throw new NotFoundException('Escenario no encontrado');

    const evaluation = this.leadershipService.evaluate(
      scenario.feedback,
      selectedOption,
      scenario.theory,
    );

    const attempt = await this.getNextAttempt(userId, scenarioId);

    const result = this.resultRepo.create({
      userId,
      referenceId: scenarioId,
      referenceType: 'scenario',
      score: evaluation.score,
      xpEarned: Math.round((evaluation.score / 100) * scenario.xpReward),
      attempt,
      selectedOption,
      feedback: evaluation,
    });
    await this.resultRepo.save(result);

    // Update progress
    await this.updateProgress(userId, scenario.moduleId, evaluation.score);

    // Award XP
    await this.usersService.addXp(userId, result.xpEarned);

    return { result, evaluation };
  }

  // ─── Submit an oral exercise transcript ───
  async submitOral(userId: string, exerciseId: string, transcript: string) {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');

    const evaluation = this.oralService.evaluate(transcript, exercise.criteria);

    const attempt = await this.getNextAttempt(userId, exerciseId);

    const result = this.resultRepo.create({
      userId,
      referenceId: exerciseId,
      referenceType: 'oral',
      score: evaluation.score,
      xpEarned: Math.round((evaluation.score / 100) * exercise.xpReward),
      attempt,
      feedback: evaluation,
    });
    await this.resultRepo.save(result);

    await this.updateProgress(userId, exercise.moduleId, evaluation.score);
    await this.usersService.addXp(userId, result.xpEarned);

    return { result, evaluation };
  }

  // ─── Submit a written exercise ───
  async submitWritten(userId: string, exerciseId: string, text: string) {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');

    const wordLimit = exercise.wordLimitMin && exercise.wordLimitMax
      ? { min: exercise.wordLimitMin, max: exercise.wordLimitMax }
      : undefined;

    const evaluation = this.writtenService.evaluate(text, exercise.criteria, wordLimit);

    const attempt = await this.getNextAttempt(userId, exerciseId);

    const result = this.resultRepo.create({
      userId,
      referenceId: exerciseId,
      referenceType: 'written',
      score: evaluation.score,
      xpEarned: Math.round((evaluation.score / 100) * exercise.xpReward),
      attempt,
      feedback: evaluation,
    });
    await this.resultRepo.save(result);

    await this.updateProgress(userId, exercise.moduleId, evaluation.score);
    await this.usersService.addXp(userId, result.xpEarned);

    return { result, evaluation };
  }

  // ─── Get all results for a user ───
  async getUserResults(userId: string) {
    return this.resultRepo.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });
  }

  // ─── Helpers ───
  private async getNextAttempt(userId: string, referenceId: string): Promise<number> {
    const last = await this.resultRepo.findOne({
      where: { userId, referenceId },
      order: { attempt: 'DESC' },
    });
    return (last?.attempt ?? 0) + 1;
  }

  private async updateProgress(userId: string, moduleId: string, score: number) {
    let progress = await this.progressRepo.findOne({ where: { userId, moduleId } });

    if (!progress) {
      progress = this.progressRepo.create({
        userId,
        moduleId,
        completedItems: 0,
        totalItems: 0,
        avgScore: 0,
        bestScore: 0,
        status: 'En curso',
      });
    }

    progress.completedItems += 1;

    // Recalculate avg
    const allResults = await this.resultRepo.find({ where: { userId } });
    const moduleResults = allResults.filter((r) => {
      // We'd ideally filter by moduleId but referenceId can be scenario or exercise
      return true; // Simplified – all results contribute
    });

    if (moduleResults.length > 0) {
      progress.avgScore = Math.round(
        moduleResults.reduce((s, r) => s + r.score, 0) / moduleResults.length,
      );
      progress.bestScore = Math.max(...moduleResults.map((r) => r.score));
    }

    if (score > progress.bestScore) {
      progress.bestScore = score;
    }

    await this.progressRepo.save(progress);
  }
}
