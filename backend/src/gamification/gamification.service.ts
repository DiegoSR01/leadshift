import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, UserAchievement } from '../entities/achievement.entity';
import { User } from '../entities/user.entity';
import { Result } from '../entities/result.entity';
import { Assessment } from '../entities/assessment.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { UsersService } from '../users/users.service';
import {
  BadgeDefinition,
  MotivationalMessage,
  XpEvent,
  GamificationSnapshot,
} from '../evaluation/interfaces/rubric.interfaces';

/**
 * Servicio de Gamificación Cognitiva basado en la
 * Teoría de la Autoeficacia de Bandura.
 *
 * Fuentes de autoeficacia implementadas:
 *  1. Experiencias de Maestría: XP y badges por completar retos
 *  2. Experiencias Vicarias: comparación con estadísticas grupales
 *  3. Persuasión Social/Verbal: mensajes motivacionales automáticos
 *  4. Estado Fisiológico: detección de patrones de estrés/mejora
 *
 * El sistema otorga XP y Badges basados en:
 *  - Superación de retos (puntaje alto en actividades)
 *  - Persistencia (racha de actividades consecutivas)
 *  - Mejora continua (pretest → práctica)
 *  - Exploración (completar módulos diversos)
 */
@Injectable()
export class GamificationService {
  // ─── Badge definitions ─────────────────────────────────────────
  private readonly BADGE_DEFINITIONS: BadgeDefinition[] = [
    // Mastery badges (Experiencias de maestría)
    {
      id: 'first_step',
      title: 'Primer Paso',
      description: 'Completa tu primera actividad en la plataforma.',
      icon: '🎯',
      category: 'mastery',
      condition: { type: 'first_activity' },
    },
    {
      id: 'leader_apprentice',
      title: 'Aprendiz de Líder',
      description: 'Obtén 80+ en un escenario de liderazgo situacional.',
      icon: '👑',
      category: 'mastery',
      condition: { type: 'score_threshold', threshold: 80, moduleFilter: 'scenario' },
    },
    {
      id: 'effective_communicator',
      title: 'Comunicador Efectivo',
      description: 'Obtén 80+ en un ejercicio de comunicación oral.',
      icon: '🎙️',
      category: 'mastery',
      condition: { type: 'score_threshold', threshold: 80, moduleFilter: 'oral' },
    },
    {
      id: 'technical_writer',
      title: 'Escritor Técnico',
      description: 'Obtén 80+ en un ejercicio de escritura técnica.',
      icon: '✍️',
      category: 'mastery',
      condition: { type: 'score_threshold', threshold: 80, moduleFilter: 'written' },
    },
    {
      id: 'perfectionist',
      title: 'Perfeccionista',
      description: 'Obtén un puntaje perfecto (95+) en cualquier actividad.',
      icon: '💎',
      category: 'mastery',
      condition: { type: 'perfect_score', threshold: 95 },
    },
    {
      id: 'triple_master',
      title: 'Triple Maestría',
      description: 'Obtén 85+ en los tres módulos principales.',
      icon: '🏆',
      category: 'mastery',
      condition: { type: 'score_threshold', threshold: 85 },
    },

    // Persistence badges (Persistencia / Autoeficacia)
    {
      id: 'consistent_3',
      title: 'Constancia Inicial',
      description: 'Mantén una racha de 3 días de actividad.',
      icon: '🔥',
      category: 'persistence',
      condition: { type: 'streak', threshold: 3 },
    },
    {
      id: 'consistent_7',
      title: 'Semana Dedicada',
      description: 'Mantén una racha de 7 días de actividad.',
      icon: '⚡',
      category: 'persistence',
      condition: { type: 'streak', threshold: 7 },
    },
    {
      id: 'consistent_14',
      title: 'Quincena Imparable',
      description: 'Mantén una racha de 14 días de actividad.',
      icon: '🌟',
      category: 'persistence',
      condition: { type: 'streak', threshold: 14 },
    },
    {
      id: 'resilient',
      title: 'Resiliencia',
      description: 'Mejora tu puntaje en un reintento de actividad.',
      icon: '🔄',
      category: 'persistence',
      condition: { type: 'improvement', threshold: 10 },
    },

    // Exploration badges
    {
      id: 'explorer',
      title: 'Explorador',
      description: 'Completa al menos una actividad en cada módulo.',
      icon: '🧭',
      category: 'exploration',
      condition: { type: 'module_complete', threshold: 1 },
    },
    {
      id: 'module_master',
      title: 'Maestro de Módulo',
      description: 'Completa todas las actividades de un módulo.',
      icon: '📚',
      category: 'exploration',
      condition: { type: 'module_complete', threshold: 100 },
    },

    // XP milestones
    {
      id: 'xp_500',
      title: 'Medio Millar',
      description: 'Acumula 500 puntos de experiencia.',
      icon: '⭐',
      category: 'mastery',
      condition: { type: 'total_xp', threshold: 500 },
    },
    {
      id: 'xp_1000',
      title: 'Millar de Experiencia',
      description: 'Acumula 1000 puntos de experiencia.',
      icon: '🌠',
      category: 'mastery',
      condition: { type: 'total_xp', threshold: 1000 },
    },
    {
      id: 'xp_2500',
      title: 'Líder en Formación',
      description: 'Acumula 2500 puntos de experiencia.',
      icon: '🚀',
      category: 'mastery',
      condition: { type: 'total_xp', threshold: 2500 },
    },
  ];

  // ─── Motivational message templates (Persuasión Social de Bandura) ─
  private readonly MASTERY_MESSAGES: MotivationalMessage[] = [
    {
      type: 'mastery_experience',
      message: '¡Tu puntaje mejoró {change}% respecto a tu evaluación anterior! Cada intento refuerza tus habilidades.',
      context: 'improvement',
    },
    {
      type: 'mastery_experience',
      message: 'Has demostrado dominio en {skill}. La práctica deliberada está dando resultados.',
      context: 'high_score',
    },
    {
      type: 'mastery_experience',
      message: '¡Excelente! Obtuviste {score}/100. Tu competencia en {area} está creciendo rápidamente.',
      context: 'good_performance',
    },
  ];

  private readonly VERBAL_PERSUASION_MESSAGES: MotivationalMessage[] = [
    {
      type: 'verbal_persuasion',
      message: 'La investigación muestra que la mejora continua es el mejor predictor de éxito profesional. ¡Sigue así!',
      context: 'encouragement',
    },
    {
      type: 'verbal_persuasion',
      message: 'Tu persistencia es admirable. Los líderes más efectivos son los que practican constantemente.',
      context: 'streak',
    },
    {
      type: 'verbal_persuasion',
      message: 'Cada error es una oportunidad de aprendizaje. Los mejores ingenieros iteran hasta alcanzar la excelencia.',
      context: 'low_score',
    },
    {
      type: 'verbal_persuasion',
      message: 'Según Bandura, la autoeficacia se construye a través de experiencias de éxito. ¡Ya estás en ese camino!',
      context: 'general',
    },
  ];

  private readonly PHYSIOLOGICAL_STATE_MESSAGES: MotivationalMessage[] = [
    {
      type: 'physiological_state',
      message: 'Si sientes frustración, recuerda: es normal al aprender algo nuevo. Toma un descanso y vuelve con energía renovada.',
      context: 'declining_scores',
    },
    {
      type: 'physiological_state',
      message: '¡Tu racha de {streak} días muestra un ritmo consistente! Mantener un horario regular mejora la retención.',
      context: 'consistent_practice',
    },
  ];

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Result)
    private readonly resultRepo: Repository<Result>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Procesa una actividad completada y dispara:
   * - Cálculo de XP
   * - Verificación de badges
   * - Generación de mensaje motivacional
   *
   * Se invoca como "Retroalimentación Inmediata" tras cada POST.
   */
  async processActivityCompletion(
    userId: string,
    activityType: 'scenario' | 'oral' | 'written',
    score: number,
    referenceId: string,
  ): Promise<{
    xpAwarded: XpEvent[];
    newBadges: { badge: BadgeDefinition; earnedAt: Date }[];
    motivationalMessage: MotivationalMessage | null;
    levelUp: boolean;
    previousLevel: number;
    currentLevel: number;
  }> {
    const user = await this.usersService.findById(userId);
    const previousLevel = user.level;
    const xpEvents: XpEvent[] = [];
    const newBadges: { badge: BadgeDefinition; earnedAt: Date }[] = [];

    // ─── 1. Base XP from score ────────────────────────────────
    const baseXp = this.calculateBaseXp(score, activityType);
    xpEvents.push({
      userId,
      source: activityType,
      amount: baseXp,
      description: `Actividad completada: ${activityType} (${score}/100)`,
      timestamp: new Date(),
    });

    // ─── 2. Improvement bonus (Experiencia de maestría) ───────
    const improvementBonus = await this.calculateImprovementBonus(userId, referenceId, score);
    if (improvementBonus > 0) {
      xpEvents.push({
        userId,
        source: 'improvement',
        amount: improvementBonus,
        description: `Bonus por mejora de puntaje (+${improvementBonus} XP)`,
        timestamp: new Date(),
      });
    }

    // ─── 3. Streak bonus ──────────────────────────────────────
    const streakBonus = this.calculateStreakBonus(user.streak);
    if (streakBonus > 0) {
      xpEvents.push({
        userId,
        source: 'streak',
        amount: streakBonus,
        description: `Bonus por racha de ${user.streak} días (+${streakBonus} XP)`,
        timestamp: new Date(),
      });
    }

    // ─── 4. Award total XP ───────────────────────────────────
    const totalXp = xpEvents.reduce((s, e) => s + e.amount, 0);
    await this.usersService.addXp(userId, totalXp);

    // ─── 5. Check and award badges ───────────────────────────
    const earnedBadges = await this.checkBadges(userId, activityType, score);
    for (const badge of earnedBadges) {
      const earnedAt = new Date();
      newBadges.push({ badge, earnedAt });

      // Award badge XP bonus
      xpEvents.push({
        userId,
        source: 'badge',
        amount: 25,
        description: `Badge desbloqueado: ${badge.title} (+25 XP)`,
        timestamp: earnedAt,
      });
      await this.usersService.addXp(userId, 25);
    }

    // ─── 6. Generate motivational message (Persuasión Social) ─
    const updatedUser = await this.usersService.findById(userId);
    const motivationalMessage = await this.generateMotivationalMessage(
      userId,
      score,
      activityType,
      improvementBonus > 0,
      updatedUser.streak,
    );

    return {
      xpAwarded: xpEvents,
      newBadges,
      motivationalMessage,
      levelUp: updatedUser.level > previousLevel,
      previousLevel,
      currentLevel: updatedUser.level,
    };
  }

  /**
   * Obtiene el snapshot de gamificación para el dashboard.
   */
  async getSnapshot(userId: string): Promise<GamificationSnapshot> {
    const user = await this.usersService.findById(userId);
    const levelInfo = this.usersService.getLevelInfo(user.xp);

    // Earned badges
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
    });

    const badges = userAchievements.map((ua) => {
      const def = this.BADGE_DEFINITIONS.find((b) => b.id === ua.achievement?.condition);
      return {
        badge: def ?? {
          id: ua.achievement?.id ?? ua.achievementId,
          title: ua.achievement?.title ?? 'Badge',
          description: ua.achievement?.description ?? '',
          icon: ua.achievement?.icon ?? '🏅',
          category: 'mastery' as const,
          condition: { type: 'first_activity' as const },
        },
        earnedAt: ua.earnedAt,
      };
    });

    // Recent XP events (from recent results)
    const recentResults = await this.resultRepo.find({
      where: { userId },
      order: { completedAt: 'DESC' },
      take: 10,
    });
    const recentXpEvents: XpEvent[] = recentResults.map((r) => ({
      userId,
      source: r.referenceType as 'scenario' | 'oral' | 'written',
      amount: r.xpEarned,
      description: `${r.referenceType}: ${r.score}/100`,
      timestamp: r.completedAt,
    }));

    // Generate a contextual message
    const motivationalMessage = await this.generateMotivationalMessage(
      userId,
      recentResults[0]?.score ?? 0,
      (recentResults[0]?.referenceType ?? 'scenario') as 'scenario' | 'oral' | 'written',
      false,
      user.streak,
    );

    // Next milestone
    const nextMilestone = {
      description: `Nivel ${levelInfo.level + 1}: ${this.getNextLevelName(levelInfo.level)}`,
      xpNeeded: levelInfo.nextLevelXp - user.xp,
      progress: levelInfo.progress,
    };

    return {
      userId,
      totalXp: user.xp,
      level: levelInfo.level,
      levelName: levelInfo.name,
      streak: user.streak,
      badges,
      recentXpEvents,
      motivationalMessage,
      nextMilestone,
    };
  }

  // ─── XP Calculation ────────────────────────────────────────────

  private calculateBaseXp(score: number, type: 'scenario' | 'oral' | 'written'): number {
    // Higher weight for more complex activities
    const multiplier = type === 'written' ? 1.2 : type === 'oral' ? 1.1 : 1.0;
    const base = Math.round((score / 100) * 50 * multiplier);

    // Bonus tiers
    if (score >= 95) return base + 20; // Excellence bonus
    if (score >= 85) return base + 10; // Mastery bonus
    if (score >= 70) return base + 5;  // Proficiency bonus
    return Math.max(base, 5); // Minimum 5 XP for effort
  }

  private async calculateImprovementBonus(
    userId: string,
    referenceId: string,
    currentScore: number,
  ): Promise<number> {
    // Find previous best score for same reference
    const previous = await this.resultRepo.findOne({
      where: { userId, referenceId },
      order: { score: 'DESC' },
    });

    if (!previous || currentScore <= previous.score) return 0;

    const improvement = currentScore - previous.score;
    // Progressive bonus: larger improvements = more XP
    if (improvement >= 30) return 30;
    if (improvement >= 20) return 20;
    if (improvement >= 10) return 15;
    if (improvement >= 5) return 10;
    return 5;
  }

  private calculateStreakBonus(streak: number): number {
    if (streak >= 14) return 15;
    if (streak >= 7) return 10;
    if (streak >= 3) return 5;
    return 0;
  }

  // ─── Badge Checking ────────────────────────────────────────────

  private async checkBadges(
    userId: string,
    activityType: 'scenario' | 'oral' | 'written',
    score: number,
  ): Promise<BadgeDefinition[]> {
    const user = await this.usersService.findById(userId);
    const results = await this.resultRepo.find({ where: { userId } });
    const earnedIds = await this.getEarnedBadgeIds(userId);
    const newBadges: BadgeDefinition[] = [];

    for (const badge of this.BADGE_DEFINITIONS) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;

      switch (badge.condition.type) {
        case 'first_activity':
          earned = results.length >= 1;
          break;

        case 'score_threshold':
          if (badge.id === 'triple_master') {
            // Check all 3 module types
            const types = ['scenario', 'oral', 'written'];
            earned = types.every((t) =>
              results.some((r) => r.referenceType === t && r.score >= (badge.condition.threshold ?? 85)),
            );
          } else if (badge.condition.moduleFilter) {
            earned = activityType === badge.condition.moduleFilter &&
              score >= (badge.condition.threshold ?? 80);
          } else {
            earned = score >= (badge.condition.threshold ?? 80);
          }
          break;

        case 'perfect_score':
          earned = score >= (badge.condition.threshold ?? 95);
          break;

        case 'streak':
          earned = user.streak >= (badge.condition.threshold ?? 3);
          break;

        case 'improvement': {
          const threshold = badge.condition.threshold ?? 10;
          // Check if any result shows improvement >= threshold
          const grouped = new Map<string, number[]>();
          for (const r of results) {
            const arr = grouped.get(r.referenceId) || [];
            arr.push(r.score);
            grouped.set(r.referenceId, arr);
          }
          earned = Array.from(grouped.values()).some((scores) => {
            if (scores.length < 2) return false;
            const sorted = [...scores].sort((a, b) => a - b);
            return sorted[sorted.length - 1] - sorted[0] >= threshold;
          });
          break;
        }

        case 'module_complete': {
          const progress = await this.progressRepo.find({ where: { userId } });
          if (badge.condition.threshold === 100) {
            // Full module completion
            earned = progress.some(
              (p) => p.totalItems > 0 && p.completedItems >= p.totalItems,
            );
          } else {
            // At least 1 activity per module type
            const types = new Set(results.map((r) => r.referenceType));
            earned = types.size >= 3;
          }
          break;
        }

        case 'total_xp':
          earned = user.xp >= (badge.condition.threshold ?? 500);
          break;
      }

      if (earned) {
        await this.awardBadge(userId, badge);
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  private async getEarnedBadgeIds(userId: string): Promise<Set<string>> {
    const achievements = await this.achievementRepo.find();
    const earned = await this.userAchievementRepo.find({ where: { userId } });
    const earnedAchievementIds = new Set(earned.map((e) => e.achievementId));

    const earnedConditions = new Set<string>();
    for (const a of achievements) {
      if (earnedAchievementIds.has(a.id) && a.condition) {
        earnedConditions.add(a.condition);
      }
    }
    return earnedConditions;
  }

  private async awardBadge(userId: string, badge: BadgeDefinition): Promise<void> {
    // Find or create the achievement record
    let achievement = await this.achievementRepo.findOne({
      where: { condition: badge.id },
    });

    if (!achievement) {
      achievement = this.achievementRepo.create({
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        condition: badge.id,
      });
      await this.achievementRepo.save(achievement);
    }

    // Check if already awarded
    const existing = await this.userAchievementRepo.findOne({
      where: { userId, achievementId: achievement.id },
    });
    if (existing) return;

    const ua = this.userAchievementRepo.create({
      userId,
      achievementId: achievement.id,
    });
    await this.userAchievementRepo.save(ua);
  }

  // ─── Motivational Messages (Bandura Persuasión Social) ─────────

  /**
   * Genera mensajes motivacionales automáticos basados en la
   * Teoría de la Autoeficacia de Bandura.
   *
   * Selecciona el mensaje más relevante según el contexto:
   * - Mejora de puntaje → Experiencia de maestría
   * - Puntaje bajo → Persuasión verbal (ánimo)
   * - Racha activa → Estado fisiológico positivo
   * - Puntaje alto → Refuerzo de maestría
   */
  private async generateMotivationalMessage(
    userId: string,
    score: number,
    activityType: 'scenario' | 'oral' | 'written',
    hasImproved: boolean,
    streak: number,
  ): Promise<MotivationalMessage | null> {
    // Check for pretest comparison (Persuasión social: mejora pretest → práctica)
    const assessments = await this.assessmentRepo.find({ where: { userId } });
    const pretest = assessments.find((a) => a.type === 'pretest');

    if (hasImproved && pretest) {
      const pretestAvg = this.averageScores(pretest.scores);
      if (score > pretestAvg) {
        const change = Math.round(((score - pretestAvg) / Math.max(pretestAvg, 1)) * 100);
        return {
          type: 'mastery_experience',
          message: `¡Tu puntaje mejoró ${change}% respecto a tu evaluación pretest! Cada intento refuerza tus habilidades de ${this.activityLabel(activityType)}.`,
          context: 'improvement_from_pretest',
        };
      }
    }

    // Mastery messages for high scores
    if (score >= 85) {
      const areaLabel = this.activityLabel(activityType);
      return {
        type: 'mastery_experience',
        message: `¡Excelente! Obtuviste ${score}/100 en ${areaLabel}. Tu competencia en esta área está creciendo rápidamente.`,
        context: 'high_score',
      };
    }

    // Improvement message
    if (hasImproved) {
      return {
        type: 'mastery_experience',
        message: '¡Tu puntaje mejoró respecto a tu intento anterior! La práctica deliberada está dando resultados. Según Bandura, cada éxito incrementa tu autoeficacia.',
        context: 'improvement',
      };
    }

    // Streak messages
    if (streak >= 7) {
      return {
        type: 'physiological_state',
        message: `¡Tu racha de ${streak} días muestra un ritmo consistente! Mantener un horario regular mejora la retención y la autoeficacia.`,
        context: 'consistent_practice',
      };
    }
    if (streak >= 3) {
      return {
        type: 'verbal_persuasion',
        message: `¡${streak} días consecutivos! Tu persistencia es admirable. Los líderes más efectivos son los que practican constantemente.`,
        context: 'streak',
      };
    }

    // Low score encouragement
    if (score < 50) {
      return {
        type: 'verbal_persuasion',
        message: 'Cada error es una oportunidad de aprendizaje. Los mejores ingenieros iteran hasta alcanzar la excelencia. ¡Inténtalo de nuevo!',
        context: 'low_score',
      };
    }

    // General encouragement
    if (score < 70) {
      return {
        type: 'verbal_persuasion',
        message: 'Según Bandura, la autoeficacia se construye a través de experiencias de éxito progresivo. ¡Ya estás en ese camino! Sigue practicando.',
        context: 'general',
      };
    }

    // Default positive
    return {
      type: 'verbal_persuasion',
      message: 'Buen trabajo. La investigación muestra que la mejora continua es el mejor predictor de éxito profesional. ¡Sigue así!',
      context: 'encouragement',
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private averageScores(scores: Record<string, number>): number {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private activityLabel(type: 'scenario' | 'oral' | 'written'): string {
    const labels: Record<string, string> = {
      scenario: 'liderazgo situacional',
      oral: 'comunicación oral técnica',
      written: 'escritura técnica y síntesis',
    };
    return labels[type] ?? type;
  }

  private getNextLevelName(currentLevel: number): string {
    const names: Record<number, string> = {
      1: 'Explorador',
      2: 'Practicante',
      3: 'Líder en Formación',
      4: 'Comunicador Efectivo',
      5: 'Estratega',
      6: 'Mentor',
      7: 'Maestro',
      8: 'Leyenda',
    };
    return names[currentLevel + 1] ?? 'Máximo nivel';
  }
}
