import { LeadershipService } from './leadership.service';

describe('LeadershipService', () => {
  let service: LeadershipService;

  beforeEach(() => {
    service = new LeadershipService();
  });

  // ─── Scenario-based evaluation ──────────────────────────────

  describe('evaluate()', () => {
    const scenarioFeedback = {
      A: { score: 100, type: 'excellent', title: 'Excelente', text: 'Muy bien.' },
      B: { score: 65,  type: 'good',      title: 'Bueno',     text: 'Bien.' },
      C: { score: 30,  type: 'warning',   title: 'Aceptable', text: 'Regular.' },
      D: { score: 10,  type: 'error',     title: 'Incorrecto', text: 'Mal.' },
    };

    it('should return optimal result when selecting optimal style for M1', () => {
      // M1 → S1 (option A)
      const result = service.evaluate(scenarioFeedback, 'A', 'Teoría', 'M1');
      expect(result.effectiveness).toBe(100);
      expect(result.isOptimal).toBe(true);
      expect(result.selectedStyle).toBe('S1');
      expect(result.optimalStyle).toBe('S1');
      expect(result.maturityLevel).toBe('M1');
      expect(result.feedback.type).toBe('excellent');
    });

    it('should return suboptimal result when selecting wrong style for M1', () => {
      // S4 for M1 → 10% effectiveness
      const result = service.evaluate(scenarioFeedback, 'D', 'Teoría', 'M1');
      expect(result.effectiveness).toBe(10);
      expect(result.isOptimal).toBe(false);
      expect(result.isAcceptable).toBe(false);
      expect(result.selectedStyle).toBe('S4');
      expect(result.optimalStyle).toBe('S1');
      expect(result.feedback.type).toBe('error');
    });

    it('should return acceptable result for adjacent style', () => {
      // S2 for M1 → 65% effectiveness (acceptable)
      const result = service.evaluate(scenarioFeedback, 'B', 'Teoría', 'M1');
      expect(result.effectiveness).toBe(65);
      expect(result.isOptimal).toBe(false);
      expect(result.isAcceptable).toBe(true);
      expect(result.feedback.type).toBe('good');
    });

    it('should handle all maturity levels correctly', () => {
      const optimalMap: Record<string, string> = { M1: 'A', M2: 'B', M3: 'C', M4: 'D' };
      for (const [maturity, option] of Object.entries(optimalMap)) {
        const result = service.evaluate(scenarioFeedback, option, 'Teoría', maturity);
        expect(result.isOptimal).toBe(true);
        expect(result.effectiveness).toBe(100);
      }
    });

    it('should handle invalid option gracefully', () => {
      const result = service.evaluate(scenarioFeedback, 'Z', 'Teoría', 'M1');
      expect(result.score).toBe(0);
      expect(result.effectiveness).toBe(0);
      expect(result.feedback.type).toBe('error');
      expect(result.feedback.title).toBe('Opción no válida');
    });

    it('should default maturity to M2 when not provided', () => {
      const result = service.evaluate(scenarioFeedback, 'B', 'Teoría');
      // B → S2, M2 → S2 = optimal
      expect(result.maturityLevel).toBe('M2');
      expect(result.isOptimal).toBe(true);
      expect(result.effectiveness).toBe(100);
    });

    it('should default maturity to M2 when invalid string provided', () => {
      const result = service.evaluate(scenarioFeedback, 'A', 'Teoría', 'XYZ');
      expect(result.maturityLevel).toBe('M2');
    });

    it('should map Kolb phase correctly based on effectiveness', () => {
      // 100% → experimentación
      const r1 = service.evaluate(scenarioFeedback, 'A', 'T', 'M1');
      expect(r1.kolbPhase).toBe('experimentación');

      // 65% → conceptualización
      const r2 = service.evaluate(scenarioFeedback, 'B', 'T', 'M1');
      expect(r2.kolbPhase).toBe('conceptualización');

      // 30% → experiencia (below 35)
      const r3 = service.evaluate(scenarioFeedback, 'C', 'T', 'M1');
      expect(r3.kolbPhase).toBe('experiencia');

      // 10% → experiencia
      const r4 = service.evaluate(scenarioFeedback, 'D', 'T', 'M1');
      expect(r4.kolbPhase).toBe('experiencia');
    });

    it('should include task and relationship behavior analysis', () => {
      const result = service.evaluate(scenarioFeedback, 'A', 'Teoría', 'M1');
      expect(result.taskBehaviorAnalysis).toContain('tarea ALTO');
      expect(result.relationshipBehaviorAnalysis).toContain('relación BAJO');
    });

    it('should include style labels', () => {
      const result = service.evaluate(scenarioFeedback, 'A', 'Teoría', 'M1');
      expect(result.styleLabel).toBe('Directivo (Telling)');
      expect(result.optimalStyleLabel).toBe('Directivo (Telling)');
    });

    it('should include maturity description', () => {
      const result = service.evaluate(scenarioFeedback, 'A', 'Teoría', 'M1');
      expect(result.maturityDescription).toContain('instrucciones claras');
    });

    it('should pass theory through to result', () => {
      const result = service.evaluate(scenarioFeedback, 'A', 'Mi teoría', 'M1');
      expect(result.theory).toBe('Mi teoría');
    });

    it('should accept uppercase S-style options directly', () => {
      const fb = {
        S1: { score: 100, type: 'excellent', title: 'OK', text: 'test' },
        S2: { score: 60,  type: 'good',      title: 'OK', text: 'test' },
      };
      const result = service.evaluate(fb, 'S1', 'Teoría', 'M1');
      expect(result.selectedStyle).toBe('S1');
      expect(result.isOptimal).toBe(true);
    });
  });

  // ─── Direct evaluation ──────────────────────────────────────

  describe('evaluateDirect()', () => {
    it('should return 100% effectiveness for optimal S1/M1 pair', () => {
      const result = service.evaluateDirect('S1', 'M1');
      expect(result.effectiveness).toBe(100);
      expect(result.isOptimal).toBe(true);
      expect(result.optimalStyle).toBe('S1');
      expect(result.feedback).toContain('Excelente elección');
    });

    it('should return 100% for all optimal pairs', () => {
      const pairs: Array<{ style: 'S1'|'S2'|'S3'|'S4'; maturity: 'M1'|'M2'|'M3'|'M4' }> = [
        { style: 'S1', maturity: 'M1' },
        { style: 'S2', maturity: 'M2' },
        { style: 'S3', maturity: 'M3' },
        { style: 'S4', maturity: 'M4' },
      ];
      for (const p of pairs) {
        const result = service.evaluateDirect(p.style, p.maturity);
        expect(result.effectiveness).toBe(100);
        expect(result.isOptimal).toBe(true);
      }
    });

    it('should return acceptable feedback for middle effectiveness', () => {
      // S2 for M1 → 65%
      const result = service.evaluateDirect('S2', 'M1');
      expect(result.effectiveness).toBe(65);
      expect(result.isOptimal).toBe(false);
      expect(result.feedback).toContain('aceptable');
    });

    it('should return inadequate feedback for low effectiveness', () => {
      // S4 for M1 → 10%
      const result = service.evaluateDirect('S4', 'M1');
      expect(result.effectiveness).toBe(10);
      expect(result.isOptimal).toBe(false);
      expect(result.feedback).toContain('inadecuado');
    });

    it('should include maturity analysis', () => {
      const result = service.evaluateDirect('S1', 'M1');
      expect(result.maturityAnalysis).toBeDefined();
      expect(result.maturityAnalysis.technical).toContain('competencia');
      expect(result.maturityAnalysis.emotional).toContain('compromiso');
    });

    it('should include behavior analysis', () => {
      const result = service.evaluateDirect('S1', 'M1');
      expect(result.behaviorAnalysis).toBeDefined();
      expect(result.behaviorAnalysis.task).toBeDefined();
      expect(result.behaviorAnalysis.relationship).toBeDefined();
    });
  });

  // ─── Effectiveness matrix symmetry ──────────────────────────

  describe('Effectiveness Matrix', () => {
    it('should have diagonal = 100 (all optimal combinations)', () => {
      expect(service.evaluateDirect('S1', 'M1').effectiveness).toBe(100);
      expect(service.evaluateDirect('S2', 'M2').effectiveness).toBe(100);
      expect(service.evaluateDirect('S3', 'M3').effectiveness).toBe(100);
      expect(service.evaluateDirect('S4', 'M4').effectiveness).toBe(100);
    });

    it('should have lowest scores at opposite corners', () => {
      // S1/M4 and S4/M1 should be 10%
      expect(service.evaluateDirect('S1', 'M4').effectiveness).toBe(10);
      expect(service.evaluateDirect('S4', 'M1').effectiveness).toBe(10);
    });

    it('should have symmetrical adjacent scores', () => {
      // S1/M2 and S2/M1 should both be 60-65 range  
      const s1m2 = service.evaluateDirect('S1', 'M2').effectiveness;
      const s2m1 = service.evaluateDirect('S2', 'M1').effectiveness;
      expect(s1m2).toBe(60);
      expect(s2m1).toBe(65);
    });

    it('all effectiveness values should be between 0 and 100', () => {
      const styles: Array<'S1'|'S2'|'S3'|'S4'> = ['S1', 'S2', 'S3', 'S4'];
      const maturities: Array<'M1'|'M2'|'M3'|'M4'> = ['M1', 'M2', 'M3', 'M4'];
      for (const s of styles) {
        for (const m of maturities) {
          const eff = service.evaluateDirect(s, m).effectiveness;
          expect(eff).toBeGreaterThanOrEqual(0);
          expect(eff).toBeLessThanOrEqual(100);
        }
      }
    });
  });
});
