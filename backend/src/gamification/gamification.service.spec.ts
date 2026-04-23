import { GamificationService } from './gamification.service';
import { Repository } from 'typeorm';
import { Achievement, UserAchievement } from '../entities/achievement.entity';
import { User } from '../entities/user.entity';
import { Result } from '../entities/result.entity';
import { Assessment } from '../entities/assessment.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { UsersService } from '../users/users.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let mockAchievementRepo: Partial<Repository<Achievement>>;
  let mockUserAchievementRepo: Partial<Repository<UserAchievement>>;
  let mockUserRepo: Partial<Repository<User>>;
  let mockResultRepo: Partial<Repository<Result>>;
  let mockAssessmentRepo: Partial<Repository<Assessment>>;
  let mockProgressRepo: Partial<Repository<UserProgress>>;
  let mockUsersService: Partial<UsersService>;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    level: 1,
    xp: 0,
    streak: 0,
  };

  beforeEach(() => {
    mockAchievementRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'ach-1', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockUserAchievementRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'ua-1', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockResultRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockAssessmentRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockProgressRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockUsersService = {
      findById: jest.fn().mockResolvedValue({ ...mockUser }),
      addXp: jest.fn().mockResolvedValue({ ...mockUser }),
      getLevelInfo: jest.fn().mockReturnValue({
        level: 1,
        name: 'Principiante',
        currentXp: 0,
        nextLevelXp: 300,
        progress: 0,
      }),
    };

    service = new GamificationService(
      mockAchievementRepo as Repository<Achievement>,
      mockUserAchievementRepo as Repository<UserAchievement>,
      mockUserRepo as Repository<User>,
      mockResultRepo as Repository<Result>,
      mockAssessmentRepo as Repository<Assessment>,
      mockProgressRepo as Repository<UserProgress>,
      mockUsersService as UsersService,
    );
  });

  // ─── processActivityCompletion ─────────────────────────────────

  describe('processActivityCompletion()', () => {
    it('should return xpAwarded, newBadges, motivationalMessage, and levelUp', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 75, 'ref-1');

      expect(result).toHaveProperty('xpAwarded');
      expect(result).toHaveProperty('newBadges');
      expect(result).toHaveProperty('motivationalMessage');
      expect(result).toHaveProperty('levelUp');
      expect(result).toHaveProperty('previousLevel');
      expect(result).toHaveProperty('currentLevel');
    });

    it('should award base XP for a scenario completion', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-1');

      const baseXpEvent = result.xpAwarded.find((e) => e.source === 'scenario');
      expect(baseXpEvent).toBeDefined();
      expect(baseXpEvent!.amount).toBeGreaterThan(0);
    });

    it('should award higher XP multiplier for written activities', async () => {
      const written = await service.processActivityCompletion('user-1', 'written', 80, 'ref-1');
      const scenario = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-2');

      const writtenXp = written.xpAwarded.find((e) => e.source === 'written')!.amount;
      const scenarioXp = scenario.xpAwarded.find((e) => e.source === 'scenario')!.amount;
      expect(writtenXp).toBeGreaterThan(scenarioXp);
    });

    it('should award higher XP multiplier for oral activities vs scenario', async () => {
      const oral = await service.processActivityCompletion('user-1', 'oral', 80, 'ref-1');
      const scenario = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-2');

      const oralXp = oral.xpAwarded.find((e) => e.source === 'oral')!.amount;
      const scenarioXp = scenario.xpAwarded.find((e) => e.source === 'scenario')!.amount;
      expect(oralXp).toBeGreaterThan(scenarioXp);
    });

    it('should award bonus XP tiers for high scores', async () => {
      // Score 95+ → +20 bonus
      const r95 = await service.processActivityCompletion('user-1', 'scenario', 95, 'ref-1');
      const baseXp95 = r95.xpAwarded.find((e) => e.source === 'scenario')!.amount;

      // Score 80 → +5 bonus (70+ tier since 80 is >=70 but <85)
      const r80 = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-2');
      const baseXp80 = r80.xpAwarded.find((e) => e.source === 'scenario')!.amount;

      expect(baseXp95).toBeGreaterThan(baseXp80);
    });

    it('should guarantee minimum 5 XP even for very low scores', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 5, 'ref-1');
      const baseXp = result.xpAwarded.find((e) => e.source === 'scenario');
      expect(baseXp!.amount).toBeGreaterThanOrEqual(5);
    });

    it('should detect improvement and award improvement bonus', async () => {
      // Mock previous result with lower score
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({
        score: 60,
        referenceId: 'ref-1',
      });

      const result = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-1');
      const improvementEvent = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(improvementEvent).toBeDefined();
      expect(improvementEvent!.amount).toBeGreaterThan(0);
    });

    it('should NOT award improvement bonus when score did not improve', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({
        score: 90,
        referenceId: 'ref-1',
      });

      const result = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-1');
      const improvementEvent = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(improvementEvent).toBeUndefined();
    });

    it('should award streak bonus for 3-day streak', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 3 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const streakEvent = result.xpAwarded.find((e) => e.source === 'streak');
      expect(streakEvent).toBeDefined();
      expect(streakEvent!.amount).toBe(5);
    });

    it('should award higher streak bonus for 7-day streak', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 7 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const streakEvent = result.xpAwarded.find((e) => e.source === 'streak');
      expect(streakEvent!.amount).toBe(10);
    });

    it('should award highest streak bonus for 14-day streak', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 14 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const streakEvent = result.xpAwarded.find((e) => e.source === 'streak');
      expect(streakEvent!.amount).toBe(15);
    });

    it('should NOT award streak bonus for streak < 3', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 2 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const streakEvent = result.xpAwarded.find((e) => e.source === 'streak');
      expect(streakEvent).toBeUndefined();
    });

    it('should call usersService.addXp with correct total', async () => {
      await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      expect(mockUsersService.addXp).toHaveBeenCalledWith('user-1', expect.any(Number));
    });

    it('should always return a motivational message', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      expect(result.motivationalMessage).toBeDefined();
      expect(result.motivationalMessage!.type).toBeDefined();
      expect(result.motivationalMessage!.message).toBeDefined();
    });
  });

  // ─── Badge system ──────────────────────────────────────────────

  describe('Badge system', () => {
    it('should award first_step badge on first activity', async () => {
      // Mock: user has 1 result (the one just submitted), no badges yet
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 70, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const firstStep = result.newBadges.find((b) => b.badge.id === 'first_step');
      expect(firstStep).toBeDefined();
    });

    it('should award leader_apprentice for 80+ in scenario', async () => {
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 85, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 85, 'ref-1');
      const badge = result.newBadges.find((b) => b.badge.id === 'leader_apprentice');
      expect(badge).toBeDefined();
    });

    it('should award perfectionist badge for score >= 95', async () => {
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 95, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 95, 'ref-1');
      const badge = result.newBadges.find((b) => b.badge.id === 'perfectionist');
      expect(badge).toBeDefined();
    });

    it('should NOT award badges that are already earned', async () => {
      // Mock: user already has first_step badge
      const existingAchievement = { id: 'ach-1', condition: 'first_step', title: 'Primer Paso', description: '', icon: '' };
      (mockAchievementRepo.find as jest.Mock).mockResolvedValue([existingAchievement]);
      (mockUserAchievementRepo.find as jest.Mock).mockResolvedValue([
        { achievementId: 'ach-1', userId: 'user-1' },
      ]);
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 70, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const firstStep = result.newBadges.find((b) => b.badge.id === 'first_step');
      expect(firstStep).toBeUndefined();
    });

    it('should award 25 XP per badge earned', async () => {
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 95, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 95, 'ref-1');
      const badgeXpEvents = result.xpAwarded.filter((e) => e.source === 'badge');
      for (const event of badgeXpEvents) {
        expect(event.amount).toBe(25);
      }
    });

    it('should award streak badges for sufficient streaks', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 7 });
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 70, referenceId: 'ref-1' },
      ]);

      const result = await service.processActivityCompletion('user-1', 'scenario', 70, 'ref-1');
      const streakBadge = result.newBadges.find(
        (b) => b.badge.id === 'consistent_3' || b.badge.id === 'consistent_7',
      );
      expect(streakBadge).toBeDefined();
    });
  });

  // ─── Motivational messages (Bandura) ───────────────────────────

  describe('Motivational messages', () => {
    it('should return mastery message for high score (85+)', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 90, 'ref-1');
      expect(result.motivationalMessage!.type).toBe('mastery_experience');
      expect(result.motivationalMessage!.context).toBe('high_score');
    });

    it('should return verbal persuasion for low score (<50)', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 40, 'ref-1');
      expect(result.motivationalMessage!.type).toBe('verbal_persuasion');
      expect(result.motivationalMessage!.context).toBe('low_score');
    });

    it('should return encouragement for mid-range score (50-69)', async () => {
      const result = await service.processActivityCompletion('user-1', 'scenario', 60, 'ref-1');
      expect(result.motivationalMessage!.type).toBe('verbal_persuasion');
      expect(result.motivationalMessage!.context).toBe('general');
    });

    it('should return streak message for 3+ day streak', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 5 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 75, 'ref-1');
      expect(result.motivationalMessage!.context).toBe('streak');
    });

    it('should return physiological state message for 7+ day streak', async () => {
      (mockUsersService.findById as jest.Mock).mockResolvedValue({ ...mockUser, streak: 8 });
      const result = await service.processActivityCompletion('user-1', 'scenario', 75, 'ref-1');
      expect(result.motivationalMessage!.type).toBe('physiological_state');
    });

    it('should return pretest comparison message when improved from pretest', async () => {
      (mockAssessmentRepo.find as jest.Mock).mockResolvedValue([
        { type: 'pretest', scores: { liderazgo: 40, comOral: 50, escritura: 45 } },
      ]);
      // Mock improvement detected
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 50 });

      const result = await service.processActivityCompletion('user-1', 'scenario', 85, 'ref-1');
      expect(result.motivationalMessage!.type).toBe('mastery_experience');
    });
  });

  // ─── getSnapshot ───────────────────────────────────────────────

  describe('getSnapshot()', () => {
    it('should return a complete gamification snapshot', async () => {
      const snapshot = await service.getSnapshot('user-1');

      expect(snapshot).toHaveProperty('userId', 'user-1');
      expect(snapshot).toHaveProperty('totalXp');
      expect(snapshot).toHaveProperty('level');
      expect(snapshot).toHaveProperty('levelName');
      expect(snapshot).toHaveProperty('streak');
      expect(snapshot).toHaveProperty('badges');
      expect(snapshot).toHaveProperty('recentXpEvents');
      expect(snapshot).toHaveProperty('motivationalMessage');
      expect(snapshot).toHaveProperty('nextMilestone');
    });

    it('should include next milestone info', async () => {
      const snapshot = await service.getSnapshot('user-1');
      expect(snapshot.nextMilestone).toHaveProperty('description');
      expect(snapshot.nextMilestone).toHaveProperty('xpNeeded');
      expect(snapshot.nextMilestone).toHaveProperty('progress');
    });

    it('should return recent XP events from results', async () => {
      (mockResultRepo.find as jest.Mock).mockResolvedValue([
        { referenceType: 'scenario', score: 80, xpEarned: 45, completedAt: new Date(), userId: 'user-1' },
        { referenceType: 'oral', score: 70, xpEarned: 40, completedAt: new Date(), userId: 'user-1' },
      ]);

      const snapshot = await service.getSnapshot('user-1');
      expect(snapshot.recentXpEvents.length).toBe(2);
    });
  });

  // ─── Improvement bonus tiers ───────────────────────────────────

  describe('Improvement bonus tiers', () => {
    it('should award 5 XP for 1-4 point improvement', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 70, referenceId: 'ref-1' });
      const result = await service.processActivityCompletion('user-1', 'scenario', 73, 'ref-1');
      const imp = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(imp!.amount).toBe(5);
    });

    it('should award 10 XP for 5-9 point improvement', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 70, referenceId: 'ref-1' });
      const result = await service.processActivityCompletion('user-1', 'scenario', 78, 'ref-1');
      const imp = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(imp!.amount).toBe(10);
    });

    it('should award 15 XP for 10-19 point improvement', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 60, referenceId: 'ref-1' });
      const result = await service.processActivityCompletion('user-1', 'scenario', 75, 'ref-1');
      const imp = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(imp!.amount).toBe(15);
    });

    it('should award 20 XP for 20-29 point improvement', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 50, referenceId: 'ref-1' });
      const result = await service.processActivityCompletion('user-1', 'scenario', 75, 'ref-1');
      const imp = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(imp!.amount).toBe(20);
    });

    it('should award 30 XP for 30+ point improvement', async () => {
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ score: 40, referenceId: 'ref-1' });
      const result = await service.processActivityCompletion('user-1', 'scenario', 80, 'ref-1');
      const imp = result.xpAwarded.find((e) => e.source === 'improvement');
      expect(imp!.amount).toBe(30);
    });
  });
});
