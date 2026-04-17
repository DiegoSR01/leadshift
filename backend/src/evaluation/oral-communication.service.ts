import { Injectable } from '@nestjs/common';
import {
  OcsStemCriterionScore,
  OcsStemEvaluationResult,
  OralTextStats,
  StructureAnalysis,
  TechnicalVocabularyAnalysis,
} from './interfaces/rubric.interfaces';
import { NlpService } from '../nlp/nlp.service';

/**
 * Motor de Evaluación de Comunicación Oral Técnica (OCS-STEM)
 *
 * Evalúa transcripciones de presentaciones orales (Whisper / Web Speech API)
 * usando la rúbrica OCS-STEM con procesamiento NLP real:
 *
 *   1. Claridad y Precisión Técnica: TF-IDF + Jaro-Winkler sobre terminología STEM
 *   2. Organización Lógica: Análisis estructural (Intro → Desarrollo → Conclusión)
 *   3. Vocabulario Técnico: Detección difusa + densidad terminológica con stemming
 *   4. Adaptación al Público: Índice Fernández-Huerta de legibilidad
 *   5. Fluidez y Seguridad: Coherencia textual (Dice) + diversidad léxica (Guiraud)
 *
 * NLP real mediante librería 'natural': tokenización, stemming, TF-IDF,
 * Jaro-Winkler, Dice coefficient, Porter Stemmer Es.
 */
@Injectable()
export class OralCommunicationService {
  constructor(private readonly nlp: NlpService) {}
  // ─── Technical vocabulary corpus (STEM + engineering) ──────────
  private readonly TECH_TERMS = [
    // Computer Science
    'algoritmo', 'arquitectura', 'software', 'hardware', 'base de datos',
    'microservicio', 'api', 'framework', 'módulo', 'componente',
    'patrón', 'escalabilidad', 'rendimiento', 'seguridad', 'interfaz',
    'protocolo', 'servidor', 'cliente', 'compilador', 'runtime',
    'frontend', 'backend', 'fullstack', 'devops', 'contenedor',
    'docker', 'kubernetes', 'cloud', 'iot', 'machine learning',
    // Networking
    'tcp', 'http', 'https', 'dns', 'firewall', 'vpn', 'latencia',
    'throughput', 'bandwidth', 'routing', 'switch', 'gateway',
    // Database
    'sql', 'nosql', 'mongodb', 'postgresql', 'índice', 'query',
    'normalización', 'transacción', 'replicación', 'sharding',
    // Engineering general
    'sistema', 'proceso', 'optimización', 'implementación', 'integración',
    'iteración', 'prototipo', 'prueba', 'testing', 'deploy',
    'metodología', 'ágil', 'scrum', 'sprint', 'pipeline',
    'requisito', 'especificación', 'abstracción', 'encapsulamiento',
    'herencia', 'polimorfismo', 'recursión', 'concurrencia',
    'autenticación', 'autorización', 'cifrado', 'hash', 'token',
    'endpoint', 'rest', 'graphql', 'websocket', 'middleware',
    'monitoreo', 'logging', 'debugging', 'refactoring', 'code review',
    'vulnerabilidad', 'inyección', 'red', 'log', 'caché',
  ];

  // ─── Discourse connectors ─────────────────────────────────────
  private readonly CONNECTORS = [
    // Additive
    'además', 'también', 'asimismo', 'igualmente', 'de igual manera',
    'por otra parte', 'adicionalmente', 'sumado a esto',
    // Causal
    'porque', 'ya que', 'debido a', 'por lo tanto', 'en consecuencia',
    'como resultado', 'de ahí que', 'por esta razón', 'dado que',
    // Contrast
    'sin embargo', 'no obstante', 'aunque', 'a pesar de', 'por el contrario',
    'en cambio', 'mientras que', 'en contraste',
    // Sequential
    'primero', 'segundo', 'tercero', 'finalmente', 'en primer lugar',
    'a continuación', 'posteriormente', 'luego', 'por último',
    'en segundo lugar', 'en tercer lugar',
    // Conclusive
    'en conclusión', 'para concluir', 'en resumen', 'en síntesis',
    'por lo tanto', 'en definitiva', 'para finalizar',
    // Exemplification
    'por ejemplo', 'es decir', 'en otras palabras', 'tal como',
    'como se puede observar', 'esto significa', 'cabe destacar',
  ];

  // ─── Introduction markers ─────────────────────────────────────
  private readonly INTRO_MARKERS = [
    'en esta presentación', 'el objetivo', 'vamos a hablar', 'el tema',
    'hoy vamos', 'el propósito', 'la finalidad', 'comenzaré',
    'quiero hablar', 'me gustaría presentar', 'el día de hoy',
    'buenas tardes', 'buenos días', 'voy a presentar', 'les presento',
    'a continuación presentaré', 'el tema que abordaremos',
    'introducción', 'objetivo general', 'objetivo específico',
  ];

  // ─── Conclusion markers ────────────────────────────────────────
  private readonly CONCLUSION_MARKERS = [
    'en conclusión', 'para concluir', 'finalmente', 'en resumen',
    'para finalizar', 'en síntesis', 'podemos concluir',
    'como conclusión', 'a modo de cierre', 'para cerrar',
    'en definitiva', 'resumiendo', 'como resultado final',
    'gracias por su atención', 'muchas gracias', 'quedo abierto a preguntas',
  ];

  /**
   * Evalúa una transcripción oral contra la rúbrica OCS-STEM.
   * Retorna desglose cuantitativo por categoría y consejos de mejora.
   */
  evaluate(
    transcript: string,
    criteria: { id: string; label: string; weight: number; description?: string }[],
  ): OcsStemEvaluationResult {
    // ─── Text statistics ──────────────────────────────────────
    const stats = this.computeStats(transcript);

    // ─── Penalty factor for very short texts (< 30 words = likely fallback/poor input)
    const lengthPenalty = stats.wordCount < 10 ? 0.3
      : stats.wordCount < 20 ? 0.5
      : stats.wordCount < 40 ? 0.7
      : stats.wordCount < 80 ? 0.85
      : 1.0;

    // ─── Structure analysis (Intro-Desarrollo-Conclusión) ─────
    const structureAnalysis = this.analyzeStructure(transcript);

    // ─── Technical vocabulary analysis ────────────────────────
    const techAnalysis = this.analyzeTechnicalVocabulary(transcript, stats.wordCount);

    // ─── Score each criterion ─────────────────────────────────
    const criteriaScores: OcsStemCriterionScore[] = criteria.map((c) =>
      this.scoreCriterion(c, stats, structureAnalysis, techAnalysis, lengthPenalty),
    );

    // ─── Weighted total ───────────────────────────────────────
    const totalWeight = criteriaScores.reduce((s, c) => s + c.weight, 0);
    const totalScore = totalWeight > 0
      ? Math.round(criteriaScores.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0))
      : 0;

    // ─── Recommendations and strengths ────────────────────────
    const recommendations = this.generateRecommendations(criteriaScores, stats, structureAnalysis, techAnalysis);
    const strengths = this.identifyStrengths(criteriaScores, stats, structureAnalysis, techAnalysis);

    return {
      score: totalScore,
      criteriaScores,
      stats,
      recommendations,
      strengths,
      structureAnalysis,
      technicalVocabularyAnalysis: techAnalysis,
      kolbPhase: this.mapKolbPhase(totalScore),
      nlpDetails: {
        wordCount: stats.wordCount,
        sentenceCount: stats.sentenceCount,
        techTermsFound: techAnalysis.termsFound,
        techTermCount: techAnalysis.termsFound.length,
        guiraudIndex: Math.round(stats.guiraudIndex * 100) / 100,
        fernandezHuerta: Math.round(stats.fernandezHuerta * 100) / 100,
        complexityLevel: stats.complexityLevel,
        connectorsCount: stats.connectorsCount,
        uniqueWordRatio: Math.round(stats.uniqueWordRatio * 100),
        hasIntroduction: structureAnalysis.hasIntroduction,
        hasConclusion: structureAnalysis.hasConclusion,
        lengthPenaltyApplied: lengthPenalty < 1.0,
      },
    };
  }

  // ─── Text statistics (NLP-powered) ─────────────────────────────

  private computeStats(text: string): OralTextStats & {
    guiraudIndex: number;
    fernandezHuerta: number;
    complexityLevel: string;
    hapaxRatio: number;
  } {
    const tokenized = this.nlp.tokenize(text);
    const { words, sentences, wordCount, sentenceCount } = tokenized;

    const avgWordsPerSentence = sentenceCount > 0
      ? Math.round((wordCount / sentenceCount) * 10) / 10
      : 0;

    // Diversidad léxica con stemming (Guiraud, TTR, Hapax)
    const diversity = this.nlp.computeLexicalDiversity(words);

    // Detección de términos técnicos con TF-IDF + Jaro-Winkler
    const termAnalysis = this.nlp.detectTerms(text, this.TECH_TERMS, words);

    // Conectores discursivos
    const lowerText = text.toLowerCase();
    const connectorsCount = this.CONNECTORS.filter((c) => lowerText.includes(c)).length;

    // Legibilidad Fernández-Huerta
    const readability = this.nlp.computeReadability(text, words, sentences);

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      techTermCount: termAnalysis.totalFound,
      uniqueWordRatio: diversity.ttr,
      connectorsCount,
      // Métricas NLP extendidas
      guiraudIndex: diversity.guiraud,
      fernandezHuerta: readability.fernandezHuerta,
      complexityLevel: readability.complexityLevel,
      hapaxRatio: diversity.hapaxRatio,
    };
  }

  // ─── Structure analysis (NLP tokenization) ─────────────────────

  private analyzeStructure(text: string): StructureAnalysis {
    const { sentences } = this.nlp.tokenize(text);
    const totalSentences = sentences.length;

    // Análisis de introducción en primer 30% del texto
    const introSection = sentences
      .slice(0, Math.max(1, Math.ceil(totalSentences * 0.3)))
      .join(' ')
      .toLowerCase();
    const hasIntroduction = this.INTRO_MARKERS.some((m) => introSection.includes(m));

    // Análisis de conclusión en último 30%
    const conclusionSection = sentences
      .slice(Math.max(0, Math.floor(totalSentences * 0.7)))
      .join(' ')
      .toLowerCase();
    const hasConclusion = this.CONCLUSION_MARKERS.some((m) => conclusionSection.includes(m));

    const hasDevelopment = totalSentences >= 3;

    // Coherencia entre oraciones consecutivas (similaridad Dice con stemming)
    let coherenceBonus = 0;
    if (totalSentences >= 3) {
      let totalSim = 0;
      let pairs = 0;
      for (let i = 0; i < sentences.length - 1; i++) {
        const sim = this.nlp.dice(sentences[i].toLowerCase(), sentences[i + 1].toLowerCase());
        totalSim += sim;
        pairs++;
      }
      const avgSim = pairs > 0 ? totalSim / pairs : 0;
      coherenceBonus = Math.round(avgSim * 10); // Up to ~10 bonus points
    }

    let structureScore = 15;
    if (hasIntroduction) structureScore += 25;
    if (hasDevelopment) structureScore += 20;
    if (hasConclusion) structureScore += 25;
    structureScore += coherenceBonus;
    structureScore = this.clamp(structureScore);

    let feedback: string;
    if (hasIntroduction && hasDevelopment && hasConclusion) {
      feedback = 'Excelente estructura: se identifican claramente la introducción, desarrollo y conclusión.';
    } else if ((hasIntroduction || hasConclusion) && hasDevelopment) {
      feedback = `Estructura parcial: ${!hasIntroduction ? 'falta una introducción clara que establezca el objetivo' : 'falta una conclusión que sintetice los puntos principales'}. El desarrollo está presente.`;
    } else {
      feedback = 'Estructura débil: el discurso no presenta una organización clara de introducción, desarrollo y conclusión. Planifica tu presentación con estos tres bloques.';
    }

    return { hasIntroduction, hasDevelopment, hasConclusion, structureScore: this.clamp(structureScore), feedback };
  }

  // ─── Technical vocabulary analysis (TF-IDF + Jaro-Winkler) ─────

  private analyzeTechnicalVocabulary(text: string, wordCount: number): TechnicalVocabularyAnalysis {
    const { words } = this.nlp.tokenize(text);
    const termAnalysis = this.nlp.detectTerms(text, this.TECH_TERMS, words);

    const totalTerms = termAnalysis.totalFound;
    const density = termAnalysis.density;

    // Ordenar términos por TF-IDF score para feedback enriquecido
    const topTerms = Object.entries(termAnalysis.tfidfScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);

    let score: number;
    let feedback: string;

    if (totalTerms >= 15) {
      score = 95;
      feedback = `Vocabulario técnico excelente: ${totalTerms} términos detectados (${termAnalysis.exactMatches.length} exactos + ${termAnalysis.fuzzyMatches.length} por similitud Jaro-Winkler). Densidad: ${density}/100 palabras. Términos más relevantes (TF-IDF): ${topTerms.join(', ')}.`;
    } else if (totalTerms >= 10) {
      score = 82;
      feedback = `Buen vocabulario técnico: ${totalTerms} términos. TF-IDF confirma uso relevante de: ${topTerms.join(', ')}. Considera ampliar con más terminología específica.`;
    } else if (totalTerms >= 6) {
      score = 65;
      feedback = `Vocabulario técnico adecuado pero limitado: ${totalTerms} términos. Densidad: ${density}/100 palabras. Incorpora más terminología STEM para fortalecer la presentación.`;
    } else if (totalTerms >= 3) {
      score = 45;
      feedback = `Vocabulario técnico insuficiente: solo ${totalTerms} términos detectados. Una presentación STEM requiere uso preciso de terminología especializada.`;
    } else {
      score = 20;
      feedback = `Vocabulario técnico muy limitado: ${totalTerms} término(s). Refuerza el uso de terminología técnica para comunicar conceptos STEM con precisión.`;
    }

    return {
      termsFound: [...termAnalysis.exactMatches, ...termAnalysis.fuzzyMatches.map((f) => f.term)],
      density,
      score,
      feedback,
    };
  }

  // ─── Criterion scoring ─────────────────────────────────────────

  private scoreCriterion(
    criterion: { id: string; label: string; weight: number },
    stats: OralTextStats & { guiraudIndex: number; fernandezHuerta: number; complexityLevel: string; hapaxRatio: number },
    structure: StructureAnalysis,
    techVocab: TechnicalVocabularyAnalysis,
    lengthPenalty: number,
  ): OcsStemCriterionScore {
    const cId = (criterion.id || criterion.label).toLowerCase();
    let score: number;
    let feedback: string;

    if (cId.includes('claridad') || cId.includes('precisión') || cId.includes('precision')) {
      // Claridad y Precisión — usando legibilidad Fernández-Huerta
      const readabilityBonus = stats.fernandezHuerta >= 60 ? 20 : stats.fernandezHuerta >= 40 ? 10 : 0;
      const diversityBonus = stats.guiraudIndex >= 5 ? 20 : stats.guiraudIndex >= 3.5 ? 12 : stats.guiraudIndex >= 2.5 ? 5 : 0;
      const techBonus = Math.min(techVocab.termsFound.length * 2, 15);
      const lengthBonus = stats.wordCount >= 150 ? 15 : stats.wordCount >= 80 ? 10 : stats.wordCount >= 40 ? 5 : 0;
      score = this.clamp(Math.round((20 + readabilityBonus + diversityBonus + techBonus + lengthBonus) * lengthPenalty));
      feedback = score >= 80
        ? `Claridad sobresaliente (Fernández-Huerta: ${stats.fernandezHuerta}, legibilidad ${stats.complexityLevel}). Terminología precisa y oraciones bien estructuradas.`
        : score >= 60
          ? `Claridad aceptable. Legibilidad: ${stats.complexityLevel} (FH: ${stats.fernandezHuerta}). Mejora la precisión de algunos conceptos técnicos.`
          : `La claridad necesita mejora. Legibilidad: ${stats.complexityLevel} (FH: ${stats.fernandezHuerta}). Simplifica oraciones complejas y define los términos antes de usarlos.`;

    } else if (cId.includes('estructura') || cId.includes('organización') || cId.includes('organizacion')) {
      // Organización Lógica
      score = structure.structureScore;
      const connectorBonus = Math.min(stats.connectorsCount * 2, 15);
      score = this.clamp(Math.round((score + connectorBonus) * lengthPenalty));
      feedback = structure.feedback;

    } else if (cId.includes('vocabulario') || cId.includes('técnico') || cId.includes('tecnico')) {
      // Vocabulario Técnico
      score = this.clamp(Math.round(techVocab.score * lengthPenalty));
      feedback = techVocab.feedback;

    } else if (cId.includes('adaptación') || cId.includes('adaptacion') || cId.includes('público') || cId.includes('publico') || cId.includes('audiencia')) {
      // Adaptación al Público — legibilidad en rango óptimo + balance técnico
      const readabilityScore = stats.fernandezHuerta >= 40 && stats.fernandezHuerta <= 80 ? 20 : 5;
      const techBalance = techVocab.termsFound.length >= 5 && techVocab.termsFound.length <= 20 ? 20 : techVocab.termsFound.length >= 3 ? 10 : 0;
      const connectorBonus = stats.connectorsCount >= 5 ? 15 : stats.connectorsCount >= 3 ? 8 : stats.connectorsCount >= 1 ? 3 : 0;
      const sentenceBonus = stats.avgWordsPerSentence >= 12 && stats.avgWordsPerSentence <= 22 ? 15 : stats.avgWordsPerSentence >= 8 ? 5 : 0;
      score = this.clamp(Math.round((15 + readabilityScore + techBalance + connectorBonus + sentenceBonus) * lengthPenalty));
      feedback = score >= 80
        ? `Excelente adaptación al público técnico. Legibilidad ${stats.complexityLevel} con balance adecuado de terminología.`
        : score >= 60
          ? `Adaptación adecuada. Nivel de legibilidad: ${stats.complexityLevel}. Calibra mejor la complejidad según tu audiencia.`
          : `El discurso no se adapta bien a la audiencia (legibilidad: ${stats.complexityLevel}). Equilibra la complejidad técnica con explicaciones accesibles.`;

    } else if (cId.includes('fluidez') || cId.includes('seguridad') || cId.includes('confianza')) {
      // Fluidez y Seguridad — diversidad léxica Guiraud + coherencia
      const guiraudBonus = stats.guiraudIndex >= 6 ? 25 : stats.guiraudIndex >= 4 ? 15 : stats.guiraudIndex >= 3 ? 8 : 0;
      const sentenceProxy = stats.sentenceCount >= 8 ? 20 : stats.sentenceCount >= 5 ? 12 : stats.sentenceCount >= 3 ? 5 : 0;
      const flowProxy = stats.connectorsCount >= 5 ? 15 : stats.connectorsCount >= 3 ? 8 : stats.connectorsCount >= 1 ? 3 : 0;
      const lengthProxy = stats.wordCount >= 150 ? 15 : stats.wordCount >= 80 ? 10 : stats.wordCount >= 40 ? 5 : 0;
      score = this.clamp(Math.round((15 + guiraudBonus + sentenceProxy + flowProxy + lengthProxy) * lengthPenalty));
      feedback = score >= 80
        ? `Excelente fluidez (Guiraud: ${stats.guiraudIndex}). Vocabulario rico y variado con buena conexión entre ideas.`
        : score >= 60
          ? `Fluidez aceptable. Diversidad léxica moderada (Guiraud: ${stats.guiraudIndex}). Practica transiciones más naturales.`
          : `La fluidez necesita trabajo. Diversidad léxica baja (Guiraud: ${stats.guiraudIndex}). Practica el discurso completo para mejorar naturalidad.`;

    } else {
      // Generic criterion
      score = this.clamp(Math.round((30 + Math.min(stats.wordCount / 15, 20) + Math.min(stats.sentenceCount * 2, 15)) * lengthPenalty));
      feedback = `Puntuación calculada: ${score}/100.`;
    }

    const level = this.scoreToLevel(score);

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      score: Math.round(score),
      level,
      feedback,
    };
  }

  // ─── Recommendations ───────────────────────────────────────────

  private generateRecommendations(
    criteriaScores: OcsStemCriterionScore[],
    stats: OralTextStats,
    structure: StructureAnalysis,
    techVocab: TechnicalVocabularyAnalysis,
  ): string[] {
    const recs: string[] = [];
    const sorted = [...criteriaScores].sort((a, b) => a.score - b.score);

    // Top weakest criteria
    for (const c of sorted.slice(0, 3)) {
      if (c.score < 70) {
        recs.push(`[${c.label}] Puntuación ${c.score}/100: ${c.feedback}`);
      }
    }

    // Structure-specific recommendations
    if (!structure.hasIntroduction) {
      recs.push('Agrega una introducción clara que establezca el objetivo y el alcance de tu presentación.');
    }
    if (!structure.hasConclusion) {
      recs.push('Incluye una conclusión que sintetice los puntos principales y refuerce tu mensaje clave.');
    }

    // Technical vocabulary suggestions
    if (techVocab.termsFound.length < 4) {
      recs.push(`Vocabulario técnico limitado (${techVocab.termsFound.length} términos). Incorpora terminología STEM específica del tema.`);
    }

    // Sentence complexity
    if (stats.avgWordsPerSentence > 28) {
      recs.push(`Oraciones demasiado largas (promedio: ${stats.avgWordsPerSentence} palabras). En comunicación oral, oraciones de 15-22 palabras mejoran la comprensión.`);
    }

    // Discourse connectors
    if (stats.connectorsCount < 3) {
      recs.push('Usa más conectores discursivos (además, sin embargo, por lo tanto) para dar fluidez y cohesión al discurso.');
    }

    if (recs.length === 0) {
      recs.push('Excelente desempeño en comunicación oral técnica. Continúa practicando para consolidar tu nivel.');
    }

    return recs;
  }

  private identifyStrengths(
    criteriaScores: OcsStemCriterionScore[],
    stats: OralTextStats,
    structure: StructureAnalysis,
    techVocab: TechnicalVocabularyAnalysis,
  ): string[] {
    const strengths: string[] = [];

    for (const c of criteriaScores) {
      if (c.score >= 80) {
        strengths.push(`${c.label}: ${c.score}/100 — Desempeño sobresaliente.`);
      }
    }

    if (structure.hasIntroduction && structure.hasConclusion) {
      strengths.push('Estructura completa con introducción, desarrollo y conclusión bien definidos.');
    }

    if (techVocab.termsFound.length >= 8) {
      strengths.push(`Vocabulario técnico rico: ${techVocab.termsFound.length} términos especializados identificados.`);
    }

    if (stats.uniqueWordRatio >= 0.55) {
      strengths.push('Alta diversidad léxica, indicando un vocabulario amplio y variado.');
    }

    return strengths;
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private clamp(val: number): number {
    return Math.max(0, Math.min(100, val));
  }

  private scoreToLevel(score: number): 'excellent' | 'proficient' | 'developing' | 'beginning' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'proficient';
    if (score >= 50) return 'developing';
    return 'beginning';
  }

  private mapKolbPhase(score: number): string {
    if (score >= 85) return 'experimentación';
    if (score >= 65) return 'conceptualización';
    if (score >= 45) return 'observación';
    return 'experiencia';
  }
}
