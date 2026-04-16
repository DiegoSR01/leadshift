import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Result } from '../entities/result.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Assessment } from '../entities/assessment.entity';
import { Achievement, UserAchievement } from '../entities/achievement.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Result) private readonly resultRepo: Repository<Result>,
    @InjectRepository(UserProgress) private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(Assessment) private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Achievement) private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement) private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(ModuleEntity) private readonly moduleRepo: Repository<ModuleEntity>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Full dashboard payload matching frontend DashboardPage
   */
  async getDashboard(userId: string) {
    const user = await this.usersService.findById(userId);
    const levelInfo = this.usersService.getLevelInfo(user.xp);

    // Module progress
    const modules = await this.moduleRepo.find({ order: { orderIndex: 'ASC' } });
    const progressList = await this.progressRepo.find({ where: { userId } });

    const moduleProgress = modules
      .filter((m) => !m.locked)
      .map((m) => {
        const p = progressList.find((pr) => pr.moduleId === m.id);
        return {
          moduleId: m.id,
          title: m.title,
          icon: m.icon,
          type: m.type,
          color: m.color,
          completedItems: p?.completedItems ?? 0,
          totalItems: p?.totalItems ?? 0,
          avgScore: p?.avgScore ?? 0,
          status: p?.status ?? 'Sin iniciar',
        };
      });

    // Results for stats
    const results = await this.resultRepo.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });

    const totalExercises = results.length;
    const avgScore = totalExercises > 0
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalExercises * 10) / 10
      : 0;

    // Recent activity (last 5)
    const recentActivity = results.slice(0, 5).map((r) => ({
      id: r.id,
      type: r.referenceType,
      score: r.score,
      xpEarned: r.xpEarned,
      completedAt: r.completedAt,
    }));

    // Pretest vs postest
    const assessments = await this.assessmentRepo.find({ where: { userId } });
    const pretest = assessments.find((a) => a.type === 'pretest');
    const postest = assessments.find((a) => a.type === 'postest');

    // Radar data
    const radarData = pretest
      ? Object.keys(pretest.scores).map((skill) => ({
          skill,
          pretest: pretest.scores[skill] ?? 0,
          postest: postest?.scores[skill] ?? pretest.scores[skill] ?? 0,
        }))
      : [];

    // Weekly progress (group results by week)
    const weeklyProgress = this.computeWeeklyProgress(results);

    return {
      user: {
        id: user.id,
        email: user.email,
        university: user.university,
        career: user.career,
        avatar: user.avatar,
        ...levelInfo,
        name: user.name,
        xp: user.xp,
        streak: user.streak,
      },
      kpis: {
        streak: user.streak,
        xp: user.xp,
        modulesCompleted: progressList.filter((p) => p.status === 'Completado').length,
        totalModules: modules.filter((m) => !m.locked).length,
        avgScore,
        totalExercises,
      },
      moduleProgress,
      radarData,
      weeklyProgress,
      recentActivity,
    };
  }

  /**
   * Detailed analytics for ProgressPage
   */
  async getAnalytics(userId: string) {
    const dashboard = await this.getDashboard(userId);

    // Achievements
    const allAchievements = await this.achievementRepo.find();
    const earned = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
    });
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    const achievements = allAchievements.map((a) => {
      const ua = earned.find((e) => e.achievementId === a.id);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        earned: earnedIds.has(a.id),
        earnedAt: ua?.earnedAt ?? null,
      };
    });

    // Module performance
    const progressList = await this.progressRepo.find({
      where: { userId },
      relations: ['module'],
    });

    const modulePerformance = progressList.map((p) => ({
      moduleId: p.moduleId,
      title: p.module?.title ?? '',
      avgScore: p.avgScore,
      attempts: p.completedItems,
      bestScore: p.bestScore,
      timeSpent: `${Math.floor(p.timeSpentMinutes / 60)}h ${p.timeSpentMinutes % 60}min`,
    }));

    // Pretest vs postest improvements
    const assessments = await this.assessmentRepo.find({ where: { userId } });
    const pretest = assessments.find((a) => a.type === 'pretest');
    const postest = assessments.find((a) => a.type === 'postest');

    let avgImprovement = 0;
    const skillImprovements: Record<string, { before: number; after: number; change: number }> = {};
    if (pretest && postest) {
      const skills = Object.keys(pretest.scores);
      let totalChange = 0;
      for (const skill of skills) {
        const before = pretest.scores[skill] ?? 0;
        const after = postest.scores[skill] ?? 0;
        const change = before > 0 ? Math.round(((after - before) / before) * 100) : 0;
        skillImprovements[skill] = { before, after, change };
        totalChange += change;
      }
      avgImprovement = skills.length > 0 ? Math.round(totalChange / skills.length) : 0;
    }

    return {
      ...dashboard,
      avgImprovement,
      skillImprovements,
      achievements,
      modulePerformance,
    };
  }

  /**
   * Final results summary for ResultsPage
   */
  async getFinalResults(userId: string) {
    const analytics = await this.getAnalytics(userId);

    // Per-module result summaries
    const modules = await this.moduleRepo.find({ where: { locked: false }, order: { orderIndex: 'ASC' } });
    const allResults = await this.resultRepo.find({ where: { userId } });

    const moduleResults = modules.map((m) => {
      const progress = analytics.modulePerformance.find((p) => p.moduleId === m.id);
      return {
        moduleId: m.id,
        title: m.title,
        icon: m.icon,
        type: m.type,
        score: progress?.avgScore ?? 0,
        exercises: progress?.attempts ?? 0,
        bestScore: progress?.bestScore ?? 0,
        timeSpent: progress?.timeSpent ?? '0h 0min',
        status: analytics.moduleProgress.find((mp) => mp.moduleId === m.id)?.status ?? 'Sin iniciar',
      };
    });

    // Overall
    const scores = moduleResults.map((m) => m.score).filter((s) => s > 0);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      overall: {
        score: overallScore,
        level: overallScore >= 85 ? 'Avanzado' : overallScore >= 65 ? 'Intermedio' : 'Básico',
        totalExercises: allResults.length,
      },
      moduleResults,
      radarData: analytics.radarData,
      improvements: analytics.skillImprovements,
    };
  }

  private computeWeeklyProgress(results: Result[]) {
    if (results.length === 0) return [];

    // Group by ISO week
    const weeks = new Map<string, { scores: number[]; date: Date }>();
    for (const r of results) {
      const d = new Date(r.completedAt);
      const year = d.getFullYear();
      const week = this.getISOWeek(d);
      const key = `${year}-W${week}`;
      if (!weeks.has(key)) {
        weeks.set(key, { scores: [], date: d });
      }
      weeks.get(key)!.scores.push(r.score);
    }

    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.scores.length,
      }));
  }

  private getISOWeek(d: Date): number {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }
}
