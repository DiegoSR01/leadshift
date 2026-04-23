import { OralCommunicationService } from './oral-communication.service';
import { NlpService } from '../nlp/nlp.service';

describe('OralCommunicationService', () => {
  let service: OralCommunicationService;

  beforeEach(() => {
    service = new OralCommunicationService(new NlpService());
  });

  // ─── Default criteria for tests ──────────────────────────────
  const defaultCriteria = [
    { id: 'claridad', label: 'Claridad y Precisión Técnica', weight: 25 },
    { id: 'organizacion', label: 'Organización Lógica', weight: 25 },
    { id: 'vocabulario', label: 'Vocabulario Técnico', weight: 20 },
    { id: 'adaptacion', label: 'Adaptación al Público', weight: 15 },
    { id: 'fluidez', label: 'Fluidez y Seguridad', weight: 15 },
  ];

  // ─── Full evaluation pipeline ────────────────────────────────

  describe('evaluate() — complete pipeline', () => {
    it('should return a well-structured evaluation result', () => {
      const transcript = 'En esta presentación vamos a hablar sobre la arquitectura de microservicios. '
        + 'El sistema utiliza una api rest con un servidor backend que implementa patrones de diseño. '
        + 'Además, la escalabilidad se logra mediante contenedores docker y kubernetes. '
        + 'Sin embargo, hay que considerar la latencia y el throughput del sistema. '
        + 'Por lo tanto, la optimización del rendimiento es clave. '
        + 'En conclusión, la arquitectura de microservicios ofrece flexibilidad y escalabilidad.';

      const result = service.evaluate(transcript, defaultCriteria);

      // Structure checks
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('criteriaScores');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('structureAnalysis');
      expect(result).toHaveProperty('technicalVocabularyAnalysis');
      expect(result).toHaveProperty('kolbPhase');

      // Score range
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      // Criteria scores count matches input
      expect(result.criteriaScores).toHaveLength(defaultCriteria.length);
    });

    it('should detect high technical vocabulary from a STEM-rich text', () => {
      const transcript = 'El algoritmo de machine learning procesa datos mediante una api rest '
        + 'conectada al backend del servidor. La base de datos postgresql almacena los resultados '
        + 'mientras que docker y kubernetes gestionan los contenedores. '
        + 'El protocolo http asegura la comunicación y el framework gestiona el middleware.';

      const result = service.evaluate(transcript, defaultCriteria);
      expect(result.technicalVocabularyAnalysis.termsFound.length).toBeGreaterThanOrEqual(8);
      expect(result.technicalVocabularyAnalysis.score).toBeGreaterThanOrEqual(70);
    });

    it('should detect poor vocabulary in a non-technical text', () => {
      const transcript = 'Hoy vamos a hablar de algo muy importante. Es un tema que me gusta mucho '
        + 'y creo que es relevante para todos. Vamos a ver diferentes aspectos de esto.';

      const result = service.evaluate(transcript, defaultCriteria);
      expect(result.technicalVocabularyAnalysis.termsFound.length).toBeLessThan(3);
      expect(result.technicalVocabularyAnalysis.score).toBeLessThan(60);
    });

    it('should identify complete structure (intro + development + conclusion)', () => {
      const transcript = 'En esta presentación vamos a hablar sobre seguridad informática. '
        + 'La autenticación por token es fundamental en sistemas modernos. '
        + 'El cifrado protege los datos en tránsito. '
        + 'Además, el firewall controla el acceso a la red. '
        + 'En conclusión, la seguridad requiere múltiples capas de protección.';

      const result = service.evaluate(transcript, defaultCriteria);
      expect(result.structureAnalysis.hasIntroduction).toBe(true);
      expect(result.structureAnalysis.hasDevelopment).toBe(true);
      expect(result.structureAnalysis.hasConclusion).toBe(true);
      expect(result.structureAnalysis.structureScore).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing conclusion', () => {
      const transcript = 'En esta presentación el objetivo es mostrar el sistema. '
        + 'El componente principal usa una interfaz gráfica moderna. '
        + 'También implementa un módulo de compilador avanzado. '
        + 'El proceso de integración es automático.';

      const result = service.evaluate(transcript, defaultCriteria);
      expect(result.structureAnalysis.hasIntroduction).toBe(true);
      expect(result.structureAnalysis.hasConclusion).toBe(false);
    });

    it('should produce recommendations for weak performance', () => {
      const transcript = 'Cosas. Más cosas. Algo más.';
      const result = service.evaluate(transcript, defaultCriteria);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should produce strengths for excellent performance', () => {
      const longTech = 'En esta presentación vamos a hablar sobre arquitectura de software moderna. '
        + 'El algoritmo principal usa un framework de machine learning conectado al backend. '
        + 'La base de datos postgresql almacena los datos. El servidor expone una api rest segura. '
        + 'Además, docker y kubernetes gestionan los contenedores en la cloud. '
        + 'Sin embargo, la latencia del protocolo http debe monitorearse mediante logging. '
        + 'Por lo tanto, el monitoreo del rendimiento y la escalabilidad son prioritarios. '
        + 'También, la seguridad incluye autenticación, cifrado y firewall. '
        + 'Finalmente, el deploy automático mediante pipeline de devops asegura calidad. '
        + 'En conclusión, esta arquitectura de microservicios es robusta y escalable.';

      const result = service.evaluate(longTech, defaultCriteria);
      expect(result.strengths.length).toBeGreaterThan(0);
    });
  });

  // ─── Criteria scoring ────────────────────────────────────────

  describe('Criteria scoring', () => {
    it('should assign higher vocabulary score when many tech terms present', () => {
      const techText = 'El algoritmo de software usa api rest con servidor backend y base de datos postgresql '
        + 'docker kubernetes cloud microservicio framework';

      const nonTechText = 'El día está soleado y hace calor en la ciudad. La gente camina por las calles.';

      const techResult = service.evaluate(techText, [{ id: 'vocabulario', label: 'Vocabulario Técnico', weight: 100 }]);
      const nonTechResult = service.evaluate(nonTechText, [{ id: 'vocabulario', label: 'Vocabulario Técnico', weight: 100 }]);

      expect(techResult.score).toBeGreaterThan(nonTechResult.score);
    });

    it('should score organization based on structure', () => {
      const structured = 'En esta presentación el objetivo es mostrar el sistema. '
        + 'El sistema tiene múltiples componentes. Cada componente tiene una función. '
        + 'En conclusión, el sistema funciona correctamente.';

      const unstructured = 'Cosas. Otras cosas. Finalmente algo.';

      const structResult = service.evaluate(structured, [{ id: 'organizacion', label: 'Organización Lógica', weight: 100 }]);
      const noStructResult = service.evaluate(unstructured, [{ id: 'organizacion', label: 'Organización Lógica', weight: 100 }]);

      expect(structResult.score).toBeGreaterThan(noStructResult.score);
    });

    it('should handle generic/unknown criterion IDs', () => {
      const result = service.evaluate('Este es un texto de prueba con varias oraciones. Tiene algo de contenido.', 
        [{ id: 'unknown_criterion', label: 'Something', weight: 100 }]);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.criteriaScores[0].feedback).toContain('Puntuación calculada');
    });

    it('should assign correct level labels based on score', () => {
      // Using a rich text to get excellent level on vocabulary
      const rich = 'algoritmo arquitectura software api framework módulo componente patrón '
        + 'escalabilidad rendimiento seguridad interfaz protocolo servidor cliente '
        + 'compilador frontend backend docker kubernetes cloud machine learning';

      const result = service.evaluate(rich, [{ id: 'vocabulario', label: 'Vocabulario Técnico', weight: 100 }]);
      const vocabCrit = result.criteriaScores[0];
      
      expect(['excellent', 'proficient', 'developing', 'beginning']).toContain(vocabCrit.level);
      if (vocabCrit.score >= 85) expect(vocabCrit.level).toBe('excellent');
      else if (vocabCrit.score >= 70) expect(vocabCrit.level).toBe('proficient');
      else if (vocabCrit.score >= 50) expect(vocabCrit.level).toBe('developing');
      else expect(vocabCrit.level).toBe('beginning');
    });
  });

  // ─── Text statistics ──────────────────────────────────────────

  describe('Text statistics', () => {
    it('should correctly count words', () => {
      const text = 'uno dos tres cuatro cinco.';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.wordCount).toBe(5);
    });

    it('should correctly count sentences', () => {
      const text = 'Primera oración. Segunda oración. Tercera oración!';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.sentenceCount).toBe(3);
    });

    it('should detect discourse connectors', () => {
      const text = 'Además, el sistema es eficiente. Sin embargo, tiene limitaciones. Por lo tanto, debemos mejorar.';
      const result = service.evaluate(text, [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.connectorsCount).toBeGreaterThanOrEqual(3);
    });

    it('should calculate unique word ratio', () => {
      const unique = 'cada palabra es diferente aquí en esta oración.';
      const repetitive = 'el el el el el el el el el el.';

      const r1 = service.evaluate(unique, [{ id: 'x', label: 'X', weight: 100 }]);
      const r2 = service.evaluate(repetitive, [{ id: 'x', label: 'X', weight: 100 }]);

      expect(r1.stats.uniqueWordRatio).toBeGreaterThan(r2.stats.uniqueWordRatio);
    });

    it('should handle empty text gracefully', () => {
      const result = service.evaluate('', [{ id: 'x', label: 'X', weight: 100 }]);
      expect(result.stats.wordCount).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Kolb phase mapping ────────────────────────────────────────

  describe('Kolb phase mapping', () => {
    it('should return valid Kolb phases', () => {
      const validPhases = ['experiencia', 'observación', 'conceptualización', 'experimentación'];
      
      // Test with minimal text to get low score → experiencia
      const low = service.evaluate('poco.', [{ id: 'x', label: 'X', weight: 100 }]);
      expect(validPhases).toContain(low.kolbPhase);

      // Test with substantial text
      const rich = 'En esta presentación el objetivo es analizar algoritmos de machine learning. '
        + 'El software usa api rest en el servidor backend con base de datos postgresql. '
        + 'Además, docker y kubernetes escalan los contenedores. '
        + 'Sin embargo, la latencia del protocolo http afecta el rendimiento. '
        + 'Por lo tanto, la optimización es fundamental para la escalabilidad. '
        + 'En conclusión, la arquitectura de microservicios es la solución óptima.';
      const high = service.evaluate(rich, defaultCriteria);
      expect(validPhases).toContain(high.kolbPhase);
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle single-word input', () => {
      const result = service.evaluate('algoritmo', defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.stats.wordCount).toBe(1);
    });

    it('should handle very long input without crashing', () => {
      const longText = Array(500).fill('El algoritmo de software procesa datos en el servidor.').join(' ');
      const result = service.evaluate(longText, defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle criteria with zero weight', () => {
      const criteria = [{ id: 'test', label: 'Test', weight: 0 }];
      const result = service.evaluate('Texto de prueba.', criteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in text', () => {
      const text = 'El @sistema #usa $caracteres %especiales & símbolos ¿cómo? ¡funciona!';
      const result = service.evaluate(text, defaultCriteria);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should return all criteria mapped correctly by ID', () => {
      const result = service.evaluate(
        'En esta presentación hablaremos sobre software y algoritmos. En conclusión, es importante.',
        defaultCriteria,
      );
      const ids = result.criteriaScores.map((c) => c.criterionId);
      expect(ids).toContain('claridad');
      expect(ids).toContain('organizacion');
      expect(ids).toContain('vocabulario');
      expect(ids).toContain('adaptacion');
      expect(ids).toContain('fluidez');
    });
  });

  // ─── Weighted score calculation ────────────────────────────────

  describe('Weighted score calculation', () => {
    it('should weight criteria properly in final score', () => {
      // Single criterion with weight 100 should make score = that criterion's score
      const vocabOnly = service.evaluate(
        'algoritmo api servidor software hardware framework',
        [{ id: 'vocabulario', label: 'Vocabulario Técnico', weight: 100 }],
      );
      const vocabCrit = vocabOnly.criteriaScores[0];
      expect(vocabOnly.score).toBe(vocabCrit.score);
    });
  });
});
