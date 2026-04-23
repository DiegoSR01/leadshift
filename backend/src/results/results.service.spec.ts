import { ResultsService } from './results.service';
import { Repository } from 'typeorm';
import { Result } from '../entities/result.entity';
import { Scenario } from '../entities/scenario.entity';
import { Exercise } from '../entities/exercise.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { LeadershipService } from '../evaluation/leadership.service';
import { OralCommunicationService } from '../evaluation/oral-communication.service';
import { WrittenCommunicationService } from '../evaluation/written-communication.service';
import { GamificationService } from '../gamification/gamification.service';
import { UsersService } from '../users/users.service';
import { NlpService } from '../nlp/nlp.service';
import { NotFoundException } from '@nestjs/common';

describe('ResultsService', () => {
  let service: ResultsService;
  let mockResultRepo: Partial<Repository<Result>>;
  let mockScenarioRepo: Partial<Repository<Scenario>>;
  let mockExerciseRepo: Partial<Repository<Exercise>>;
  let mockProgressRepo: Partial<Repository<UserProgress>>;
  let leadershipService: LeadershipService;
  let oralService: OralCommunicationService;
  let writtenService: WrittenCommunicationService;
  let mockGamificationService: Partial<GamificationService>;
  let mockUsersService: Partial<UsersService>;

  const mockScenario: Partial<Scenario> = {
    id: 'scenario-1',
    moduleId: 'module-1',
    title: 'Test Scenario',
    context: 'Context',
    situation: 'Situation',
    question: 'Question?',
    xpReward: 50,
    maturityLevel: 'M1',
    feedback: {
      A: { score: 100, type: 'excellent', title: 'Excelente', text: 'Muy bien.' },
      B: { score: 65,  type: 'good',      title: 'Bueno',     text: 'Bien.' },
      C: { score: 30,  type: 'warning',   title: 'Regular',   text: 'Regular.' },
      D: { score: 10,  type: 'error',     title: 'Error',     text: 'Mal.' },
    },
    theory: 'Teoría de Hersey-Blanchard',
  };

  const mockExercise: Partial<Exercise> = {
    id: 'exercise-1',
    moduleId: 'module-2',
    title: 'Test Exercise',
    exerciseType: 'oral',
    xpReward: 50,
    wordLimitMin: 50,
    wordLimitMax: 300,
    criteria: [
      { id: 'claridad', label: 'Claridad y Precisión Técnica', weight: 25 },
      { id: 'organizacion', label: 'Organización Lógica', weight: 25 },
      { id: 'vocabulario', label: 'Vocabulario Técnico', weight: 20 },
      { id: 'adaptacion', label: 'Adaptación al Público', weight: 15 },
      { id: 'fluidez', label: 'Fluidez y Seguridad', weight: 15 },
    ],
  };

  const mockGamificationResult = {
    xpAwarded: [{ userId: 'user-1', source: 'scenario' as const, amount: 50, description: 'test', timestamp: new Date() }],
    newBadges: [],
    motivationalMessage: { type: 'verbal_persuasion' as const, message: 'Bien hecho', context: 'general' },
    levelUp: false,
    previousLevel: 1,
    currentLevel: 1,
  };

  beforeEach(() => {
    // Use real evaluation services (pure logic, no DB)
    const nlpService = new NlpService();
    leadershipService = new LeadershipService();
    oralService = new OralCommunicationService(nlpService);
    writtenService = new WrittenCommunicationService(nlpService);

    mockResultRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'result-1', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockScenarioRepo = {
      findOne: jest.fn().mockResolvedValue(mockScenario),
    };

    mockExerciseRepo = {
      findOne: jest.fn().mockResolvedValue(mockExercise),
    };

    mockProgressRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({
        id: 'progress-1', ...data, completedItems: data.completedItems ?? 0,
      })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockGamificationService = {
      processActivityCompletion: jest.fn().mockResolvedValue(mockGamificationResult),
    };

    mockUsersService = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1', level: 1, xp: 0 }),
      addXp: jest.fn().mockResolvedValue({ id: 'user-1', level: 1, xp: 50 }),
    };

    service = new ResultsService(
      mockResultRepo as Repository<Result>,
      mockScenarioRepo as Repository<Scenario>,
      mockExerciseRepo as Repository<Exercise>,
      mockProgressRepo as Repository<UserProgress>,
      leadershipService,
      oralService,
      writtenService,
      mockGamificationService as GamificationService,
      mockUsersService as UsersService,
    );
  });

  // ─── submitScenario ────────────────────────────────────────────

  describe('submitScenario()', () => {
    it('should evaluate and save scenario result', async () => {
      const result = await service.submitScenario('user-1', 'scenario-1', 'A');

      expect(result.result).toBeDefined();
      expect(result.evaluation).toBeDefined();
      expect(result.gamification).toBeDefined();
      expect(result.result.referenceType).toBe('scenario');
      expect(result.result.selectedOption).toBe('A');
      expect(result.result.score).toBe(100); // A = 100 in our mockScenario
    });

    it('should use Hersey-Blanchard evaluation with maturity level', async () => {
      const result = await service.submitScenario('user-1', 'scenario-1', 'A');

      // S1 for M1 = optimal
      expect(result.evaluation.isOptimal).toBe(true);
      expect(result.evaluation.effectiveness).toBe(100);
      expect(result.evaluation.selectedStyle).toBe('S1');
      expect(result.evaluation.maturityLevel).toBe('M1');
    });

    it('should save result to database', async () => {
      await service.submitScenario('user-1', 'scenario-1', 'A');
      expect(mockResultRepo.save).toHaveBeenCalled();
    });

    it('should trigger gamification processing', async () => {
      await service.submitScenario('user-1', 'scenario-1', 'A');
      expect(mockGamificationService.processActivityCompletion).toHaveBeenCalledWith(
        'user-1', 'scenario', 100, 'scenario-1',
      );
    });

    it('should handle suboptimal choices correctly', async () => {
      const result = await service.submitScenario('user-1', 'scenario-1', 'D');
      expect(result.evaluation.isOptimal).toBe(false);
      expect(result.evaluation.effectiveness).toBe(10); // S4 for M1
    });

    it('should throw NotFoundException for nonexistent scenario', async () => {
      (mockScenarioRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.submitScenario('user-1', 'nonexistent', 'A'))
        .rejects.toThrow(NotFoundException);
    });

    it('should increment attempt number', async () => {
      // First attempt
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue(null);
      const r1 = await service.submitScenario('user-1', 'scenario-1', 'A');
      expect(r1.result.attempt).toBe(1);

      // Second attempt
      (mockResultRepo.findOne as jest.Mock).mockResolvedValue({ attempt: 1 });
      const r2 = await service.submitScenario('user-1', 'scenario-1', 'B');
      expect(r2.result.attempt).toBe(2);
    });

    it('should calculate XP earned based on score and reward', async () => {
      const result = await service.submitScenario('user-1', 'scenario-1', 'A');
      // score=100, xpReward=50 → Math.round(100/100 * 50) = 50
      expect(result.result.xpEarned).toBe(50);
    });

    it('should update user progress', async () => {
      await service.submitScenario('user-1', 'scenario-1', 'A');
      expect(mockProgressRepo.save).toHaveBeenCalled();
    });
  });

  // ─── submitOral ────────────────────────────────────────────────

  describe('submitOral()', () => {
    it('should evaluate and save oral submission', async () => {
      const transcript = 'En esta presentación el objetivo es analizar algoritmos de machine learning. '
        + 'El software del servidor implementa una api rest con base de datos postgresql. '
        + 'Además, la arquitectura utiliza docker y kubernetes para la escalabilidad. '
        + 'En conclusión, la optimización del rendimiento es fundamental.';

      const result = await service.submitOral('user-1', 'exercise-1', transcript);

      expect(result.result).toBeDefined();
      expect(result.evaluation).toBeDefined();
      expect(result.gamification).toBeDefined();
      expect(result.result.referenceType).toBe('oral');
      expect(result.evaluation.score).toBeGreaterThanOrEqual(0);
      expect(result.evaluation.score).toBeLessThanOrEqual(100);
    });

    it('should include OCS-STEM criteria scores', async () => {
      const result = await service.submitOral('user-1', 'exercise-1', 'El algoritmo usa api rest.');
      expect(result.evaluation.criteriaScores).toHaveLength(5);
    });

    it('should include structure analysis', async () => {
      const result = await service.submitOral('user-1', 'exercise-1', 'Texto de prueba.');
      expect(result.evaluation.structureAnalysis).toBeDefined();
      expect(result.evaluation.technicalVocabularyAnalysis).toBeDefined();
    });

    it('should trigger gamification for oral type', async () => {
      await service.submitOral('user-1', 'exercise-1', 'Texto.');
      expect(mockGamificationService.processActivityCompletion).toHaveBeenCalledWith(
        'user-1', 'oral', expect.any(Number), 'exercise-1',
      );
    });

    it('should throw NotFoundException for nonexistent exercise', async () => {
      (mockExerciseRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.submitOral('user-1', 'nonexistent', 'Text'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── submitWritten ─────────────────────────────────────────────

  describe('submitWritten()', () => {
    it('should evaluate and save written submission', async () => {
      const text = 'La arquitectura de microservicios descompone la aplicación en servicios independientes. '
        + 'Cada microservicio se comunica mediante api rest. '
        + 'Además, docker y kubernetes orquestan los contenedores. '
        + 'En conclusión, la escalabilidad mejora significativamente.';

      const result = await service.submitWritten('user-1', 'exercise-1', text);

      expect(result.result).toBeDefined();
      expect(result.evaluation).toBeDefined();
      expect(result.gamification).toBeDefined();
      expect(result.result.referenceType).toBe('written');
    });

    it('should include TWR-specific analysis', async () => {
      const result = await service.submitWritten('user-1', 'exercise-1', 'El concepto de optimización requiere análisis.');
      expect(result.evaluation.synthesisAnalysis).toBeDefined();
      expect(result.evaluation.cohesionAnalysis).toBeDefined();
      expect(result.evaluation.issues).toBeDefined();
      expect(result.evaluation.editingSuggestions).toBeDefined();
    });

    it('should apply word limits from exercise config', async () => {
      const shortText = 'Corto.';
      const result = await service.submitWritten('user-1', 'exercise-1', shortText);
      // With wordLimitMin=50, this should flag as below limit
      expect(result.evaluation.synthesisAnalysis.withinLimits).toBe(false);
    });

    it('should trigger gamification for written type', async () => {
      await service.submitWritten('user-1', 'exercise-1', 'Texto de prueba.');
      expect(mockGamificationService.processActivityCompletion).toHaveBeenCalledWith(
        'user-1', 'written', expect.any(Number), 'exercise-1',
      );
    });

    it('should handle exercise without word limits', async () => {
      (mockExerciseRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockExercise,
        wordLimitMin: null,
        wordLimitMax: null,
      });
      const result = await service.submitWritten('user-1', 'exercise-1', 'Texto sin límites de palabras.');
      expect(result.evaluation).toBeDefined();
    });
  });

  // ─── getUserResults ────────────────────────────────────────────

  describe('getUserResults()', () => {
    it('should return all results for a user', async () => {
      const mockResults = [
        { id: 'r1', userId: 'user-1', score: 90 },
        { id: 'r2', userId: 'user-1', score: 75 },
      ];
      (mockResultRepo.find as jest.Mock).mockResolvedValue(mockResults);

      const results = await service.getUserResults('user-1');
      expect(results).toHaveLength(2);
    });

    it('should query with correct userId and order', async () => {
      await service.getUserResults('user-1');
      expect(mockResultRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { completedAt: 'DESC' },
      });
    });
  });

  // ─── Integration: full pipeline ────────────────────────────────

  describe('Full pipeline integration', () => {
    it('should return result + evaluation + gamification for scenario', async () => {
      const response = await service.submitScenario('user-1', 'scenario-1', 'A');
      
      // Result entity
      expect(response.result.userId).toBe('user-1');
      expect(response.result.referenceId).toBe('scenario-1');
      
      // Evaluation (Hersey-Blanchard)
      expect(response.evaluation.selectedStyle).toBeDefined();
      expect(response.evaluation.kolbPhase).toBeDefined();
      
      // Gamification (Bandura)
      expect(response.gamification.xpAwarded).toBeDefined();
      expect(response.gamification.motivationalMessage).toBeDefined();
    });

    it('should produce different scores for different options', async () => {
      const r1 = await service.submitScenario('user-1', 'scenario-1', 'A');
      const r2 = await service.submitScenario('user-1', 'scenario-1', 'D');
      expect(r1.result.score).toBeGreaterThan(r2.result.score);
    });

    it('should produce richer evaluation for longer transcripts', async () => {
      const short = 'Corto.';
      const long = 'En esta presentación el objetivo es analizar algoritmos de machine learning. '
        + 'El software del servidor implementa una api rest con base de datos postgresql. '
        + 'Además, la arquitectura utiliza docker y kubernetes. '
        + 'Sin embargo, la latencia debe controlarse. '
        + 'En conclusión, la optimización es clave.';

      const r1 = await service.submitOral('user-1', 'exercise-1', short);
      const r2 = await service.submitOral('user-1', 'exercise-1', long);
      expect(r2.evaluation.score).toBeGreaterThan(r1.evaluation.score);
    });
  });
});
