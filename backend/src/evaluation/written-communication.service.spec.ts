import { WrittenCommunicationService } from './written-communication.service';
import { NlpService } from '../nlp/nlp.service';

describe('WrittenCommunicationService', () => {
  let service: WrittenCommunicationService;

  beforeEach(() => {
    service = new WrittenCommunicationService(new NlpService());
  });

  const defaultCriteria = [
    { id: 'sintesis', label: 'Capacidad de Síntesis', weight: 30 },
    { id: 'cohesion', label: 'Cohesión y Gramática', weight: 25 },
    { id: 'claridad', label: 'Claridad y Comprensión', weight: 25 },
    { id: 'adaptacion', label: 'Adaptación al Público', weight: 20 },
  ];

  // ─── Full evaluation pipeline ────────────────────────────────

  describe('evaluate() — complete pipeline', () => {
    it('should return a well-structured evaluation result', () => {
      const text = 'La arquitectura de microservicios permite escalar componentes de forma independiente. '
        + 'Cada servicio se despliega en contenedores docker gestionados por kubernetes. '
        + 'Además, la comunicación entre servicios usa protocolos http y websocket. '
        + 'Sin embargo, la latencia debe monitorearse cuidadosamente. '
        + 'En conclusión, esta arquitectura ofrece flexibilidad y resiliencia.';

      const result = service.evaluate(text, defaultCriteria);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('criteriaScores');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('synthesisAnalysis');
      expect(result).toHaveProperty('cohesionAnalysis');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('editingSuggestions');
      expect(result).toHaveProperty('kolbPhase');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.criteriaScores).toHaveLength(defaultCriteria.length);
    });

    it('should give higher score to a well-written technical text', () => {
      const good = 'La arquitectura de microservicios descompone una aplicación en servicios independientes. '
        + 'Cada microservicio se comunica mediante api rest o websocket. '
        + 'Además, docker y kubernetes orquestan los contenedores. '
        + 'Sin embargo, la latencia entre servicios requiere optimización del protocolo. '
        + 'Por lo tanto, el monitoreo del rendimiento es esencial para mantener la escalabilidad. '
        + 'En conclusión, esta arquitectura facilita el deploy continuo y la integración.';

      const bad = 'Cosas. Más cosas. Algo.';

      const goodResult = service.evaluate(good, defaultCriteria);
      const badResult = service.evaluate(bad, defaultCriteria);

      expect(goodResult.score).toBeGreaterThan(badResult.score);
    });
  });

  // ─── Text statistics ──────────────────────────────────────────

  describe('Text statistics (spaCy-inspired)', () => {
    it('should count words correctly', () => {
      const result = service.evaluate('Una dos tres cuatro cinco.', [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.wordCount).toBe(5);
    });

    it('should count sentences correctly', () => {
      const result = service.evaluate('Primera oración. Segunda oración! Tercera?', [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.sentenceCount).toBe(3);
    });

    it('should count paragraphs correctly', () => {
      const text = 'Primer párrafo aquí.\n\nSegundo párrafo aquí.\n\nTercer párrafo aquí.';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.paragraphCount).toBe(3);
    });

    it('should detect technical terms', () => {
      const text = 'La arquitectura usa docker y kubernetes para deploy de microservicios con postgresql.';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.techTermCount).toBeGreaterThanOrEqual(4);
    });

    it('should calculate lexical density', () => {
      const text = 'La arquitectura de microservicios permite escalabilidad y rendimiento del sistema.';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.lexicalDensity).toBeGreaterThan(0);
      expect(result.stats.lexicalDensity).toBeLessThanOrEqual(1);
    });

    it('should calculate unique word ratio', () => {
      const diverse = 'Cada palabra aquí resulta ser completamente diferente y única.';
      const repetitive = 'el el el el el el el el el el.';

      const r1 = service.evaluate(diverse, [{ id: 'x', label: 'X', weight: 100 }]);
      const r2 = service.evaluate(repetitive, [{ id: 'x', label: 'X', weight: 100 }]);

      expect(r1.stats.uniqueWordRatio).toBeGreaterThan(r2.stats.uniqueWordRatio);
    });
  });

  // ─── Synthesis analysis ────────────────────────────────────────

  describe('Synthesis analysis', () => {
    it('should detect concept density', () => {
      const conceptRich = 'El concepto de optimización del sistema requiere un análisis de la estrategia '
        + 'del proceso. El modelo teórico establece criterios de evaluación basados en evidencia '
        + 'y datos sobre variables clave. El algoritmo del servidor utiliza api rest con middleware.';

      const result = service.evaluate(conceptRich, defaultCriteria);
      expect(result.synthesisAnalysis.keyConceptsFound).toBeGreaterThan(0);
      expect(result.synthesisAnalysis.conceptDensity).toBeGreaterThan(0);
    });

    it('should check word limits when provided', () => {
      const short = 'Texto corto.';
      const result = service.evaluate(short, defaultCriteria, { min: 50, max: 200 });
      expect(result.synthesisAnalysis.withinLimits).toBe(false);
    });

    it('should validate when text is within word limits', () => {
      const text = Array(10).fill('La arquitectura del sistema es compleja y requiere análisis.').join(' ');
      const result = service.evaluate(text, defaultCriteria, { min: 10, max: 200 });
      expect(result.synthesisAnalysis.withinLimits).toBe(true);
    });

    it('should detect redundancy from filler expressions', () => {
      const fillerText = 'En mi opinión personal, básicamente el sistema es importante. '
        + 'Como ya mencioné, es necesario recalcar que el proceso es fundamental. '
        + 'Cabe mencionar que como se puede observar, la implementación es clave.';

      const result = service.evaluate(fillerText, defaultCriteria);
      expect(result.synthesisAnalysis.redundancyIndex).toBeGreaterThan(0);
    });

    it('should detect repeated trigrams', () => {
      const repetitive = 'El sistema es bueno. El sistema es bueno. El sistema es bueno.';
      const result = service.evaluate(repetitive, defaultCriteria);
      expect(result.synthesisAnalysis.redundancyIndex).toBeGreaterThan(0);
    });
  });

  // ─── Cohesion analysis ──────────────────────────────────────────

  describe('Cohesion analysis', () => {
    it('should detect discourse connectors', () => {
      const text = 'Además, el sistema es eficiente. Sin embargo, tiene limitaciones. '
        + 'Por lo tanto, se necesitan mejoras. Por ejemplo, la interfaz puede mejorar. '
        + 'En conclusión, hay que iterar.';

      const result = service.evaluate(text, defaultCriteria);
      expect(result.cohesionAnalysis.connectorsUsed.length).toBeGreaterThanOrEqual(3);
      expect(result.cohesionAnalysis.transitionScore).toBeGreaterThan(50);
    });

    it('should detect poor cohesion in disconnected text', () => {
      const disconnected = 'Perro. Casa. Azul. Rápido. Silencio.';
      const result = service.evaluate(disconnected, defaultCriteria);
      expect(result.cohesionAnalysis.connectorsUsed.length).toBe(0);
      expect(result.cohesionAnalysis.transitionScore).toBeLessThanOrEqual(50);
    });

    it('should calculate flow score based on sentence length variance', () => {
      const result = service.evaluate(
        'El sistema procesa datos rápidamente. El servidor almacena resultados eficientemente. La api responde correctamente.',
        defaultCriteria,
      );
      expect(result.cohesionAnalysis.flowScore).toBeGreaterThanOrEqual(0);
      expect(result.cohesionAnalysis.flowScore).toBeLessThanOrEqual(100);
    });

    it('should evaluate structure quality (multi-level)', () => {
      const wellStructured = 'Primer punto importante sobre la arquitectura.\n\n'
        + 'Segundo punto: además, la implementación del algoritmo requiere optimización. '
        + 'Sin embargo, el rendimiento actual es aceptable.\n\n'
        + 'Tercer punto: por lo tanto, la estrategia de deploy es correcta.';

      const result = service.evaluate(wellStructured, defaultCriteria);
      expect(result.cohesionAnalysis.structureQuality).toBeGreaterThan(40);
    });
  });

  // ─── Issue detection ───────────────────────────────────────────

  describe('Issue detection', () => {
    it('should warn when text exceeds word limit', () => {
      const longText = Array(100).fill('Esta es una oración de prueba para exceder el límite.').join(' ');
      const result = service.evaluate(longText, defaultCriteria, { min: 10, max: 50 });
      const lengthIssue = result.issues.find((i) => i.category === 'length');
      expect(lengthIssue).toBeDefined();
      expect(lengthIssue!.type).toBe('warning');
      expect(lengthIssue!.message).toContain('excede');
    });

    it('should warn when text is below word limit', () => {
      const result = service.evaluate('Corto.', defaultCriteria, { min: 50, max: 200 });
      const lengthIssue = result.issues.find((i) => i.category === 'length');
      expect(lengthIssue).toBeDefined();
      expect(lengthIssue!.type).toBe('warning');
      expect(lengthIssue!.message).toContain('por debajo');
    });

    it('should confirm proper length within limits', () => {
      const text = Array(8).fill('La arquitectura del sistema requiere análisis detallado.').join(' ');
      const result = service.evaluate(text, defaultCriteria, { min: 10, max: 100 });
      const lengthIssue = result.issues.find((i) => i.category === 'length');
      expect(lengthIssue).toBeDefined();
      expect(lengthIssue!.type).toBe('success');
    });

    it('should detect filler expressions as synthesis issues', () => {
      const text = 'Básicamente en mi opinión personal el sistema funciona bien.';
      const result = service.evaluate(text, defaultCriteria);
      const synthesisIssue = result.issues.find(
        (i) => i.category === 'synthesis' && i.type === 'warning',
      );
      expect(synthesisIssue).toBeDefined();
      expect(synthesisIssue!.message).toContain('superfluas');
    });

    it('should warn about single-paragraph structure', () => {
      const text = 'Este es un texto de un solo párrafo sin divisiones claras que '
        + 'trata múltiples puntos sin separación adecuada entre ellos.';
      const result = service.evaluate(text, defaultCriteria);
      const structureIssue = result.issues.find(
        (i) => i.category === 'structure' && i.type === 'warning',
      );
      expect(structureIssue).toBeDefined();
    });

    it('should confirm good vocabulary usage', () => {
      const text = 'La arquitectura de microservicios con docker kubernetes api servidor postgresql monitoreo deploy pipeline algoritmo software hardware.';
      const result = service.evaluate(text, defaultCriteria);
      const vocabIssue = result.issues.find(
        (i) => i.category === 'vocabulary' && i.type === 'success',
      );
      expect(vocabIssue).toBeDefined();
    });
  });

  // ─── Editing suggestions ───────────────────────────────────────

  describe('Editing suggestions', () => {
    it('should always return at least one suggestion', () => {
      const result = service.evaluate('Texto.', defaultCriteria);
      expect(result.editingSuggestions.length).toBeGreaterThan(0);
    });

    it('should suggest removing fillers when present', () => {
      const text = 'Básicamente en mi opinión personal cabe mencionar que el sistema es bueno. '
        + 'Como ya mencioné, es necesario recalcar que funciona. '
        + 'El server usa api y docker para el deploy del sistema con kubernetes.';

      const result = service.evaluate(text, defaultCriteria);
      const hasRedundancySuggestion = result.editingSuggestions.some(
        (s) => s.includes('redundan') || s.includes('relleno') || s.includes('repetitiv') || s.includes('superfluas'),
      );
      expect(hasRedundancySuggestion).toBe(true);
    });

    it('should return positive feedback for excellent text', () => {
      const excellent = 'La arquitectura de microservicios permite escalabilidad independiente. '
        + 'Cada componente se despliega en contenedores docker orquestados por kubernetes. '
        + 'Además, la comunicación usa api rest con protocolo http seguro. '
        + 'Sin embargo, la latencia requiere monitoreo constante del rendimiento. '
        + 'Por lo tanto, el sistema implementa logging y dashboard de métricas. '
        + 'Por ejemplo, el throughput se mide con herramientas de devops.\n\n'
        + 'En segundo lugar, la seguridad incluye autenticación por token y cifrado. '
        + 'El firewall protege contra vulnerabilidades de inyección sql.\n\n'
        + 'En conclusión, esta optimización integral asegura calidad y confiabilidad.';

      const result = service.evaluate(excellent, defaultCriteria);
      // Should still have suggestions, but they can be positive
      expect(result.editingSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ─── Criteria scoring ─────────────────────────────────────────

  describe('Criteria scoring', () => {
    it('should score synthesis criterion using synthesis analysis', () => {
      const result = service.evaluate(
        'El concepto principal del modelo requiere un proceso de optimización. La estrategia incluye análisis de datos.',
        [{ id: 'sintesis', label: 'Capacidad de Síntesis', weight: 100 }],
      );
      expect(result.criteriaScores[0].criterionId).toBe('sintesis');
      expect(result.criteriaScores[0].score).toBeGreaterThanOrEqual(0);
      expect(result.criteriaScores[0].level).toBeDefined();
    });

    it('should score cohesion criterion using cohesion analysis', () => {
      const result = service.evaluate(
        'Además, el sistema funciona bien. Sin embargo, necesita mejoras. Por lo tanto, se requiere acción.',
        [{ id: 'cohesion', label: 'Cohesión y Gramática', weight: 100 }],
      );
      expect(result.criteriaScores[0].criterionId).toBe('cohesion');
      expect(result.criteriaScores[0].score).toBeGreaterThan(0);
    });

    it('should handle unknown criterion with generic scoring', () => {
      const result = service.evaluate(
        'Texto de prueba con contenido técnico básico.',
        [{ id: 'randomCriterion', label: 'Random', weight: 100 }],
      );
      expect(result.criteriaScores[0].feedback).toContain('Puntuación calculada');
    });

    it('should assign correct level labels', () => {
      const result = service.evaluate(
        'Este texto tiene contenido.',
        [{ id: 'claridad', label: 'Claridad y Comprensión', weight: 100 }],
      );
      const level = result.criteriaScores[0].level;
      expect(['excellent', 'proficient', 'developing', 'beginning']).toContain(level);
    });
  });

  // ─── Kolb phase mapping ────────────────────────────────────────

  describe('Kolb phase mapping', () => {
    it('should return valid Kolb phases', () => {
      const validPhases = ['experiencia', 'observación', 'conceptualización', 'experimentación'];
      
      const result = service.evaluate('Texto básico.', defaultCriteria);
      expect(validPhases).toContain(result.kolbPhase);
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const result = service.evaluate('', defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.stats.wordCount).toBe(0);
    });

    it('should handle single-word input', () => {
      const result = service.evaluate('algoritmo', defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long input without performance issues', () => {
      const longText = Array(300).fill('La arquitectura del sistema requiere análisis detallado.').join(' ');
      const start = Date.now();
      const result = service.evaluate(longText, defaultCriteria);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // Should complete in < 5s
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with only special characters', () => {
      const result = service.evaluate('!@#$%^&*()', defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle word limits with no limits provided', () => {
      const result = service.evaluate('Texto simple de prueba.', defaultCriteria);
      expect(result.synthesisAnalysis.withinLimits).toBeDefined();
    });

    it('should clamp all scores between 0 and 100', () => {
      const result = service.evaluate(
        'El algoritmo de software procesa datos en el servidor con api rest.',
        defaultCriteria,
      );
      for (const c of result.criteriaScores) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
      }
      expect(result.synthesisAnalysis.score).toBeGreaterThanOrEqual(0);
      expect(result.synthesisAnalysis.score).toBeLessThanOrEqual(100);
      expect(result.cohesionAnalysis.score).toBeGreaterThanOrEqual(0);
      expect(result.cohesionAnalysis.score).toBeLessThanOrEqual(100);
    });
  });
});
