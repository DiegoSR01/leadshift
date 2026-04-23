import { Injectable } from '@nestjs/common';
import {
  TwrCriterionScore,
  TwrEvaluationResult,
  TwrNlpDetails,
  WrittenTextStats,
  SynthesisAnalysis,
  CohesionAnalysis,
  TextIssue,
} from './interfaces/rubric.interfaces';
import { NlpService } from '../nlp/nlp.service';

/**
 * Motor de Evaluación de Escritura Técnica y Síntesis (TWR)
 *
 * Implementa análisis NLP real mediante librería 'natural':
 *  - Tokenización con WordTokenizer
 *  - Stemming español (PorterStemmerEs)
 *  - TF-IDF para densidad de conceptos clave
 *  - Jaro-Winkler para detección difusa de vocabulario técnico
 *  - Coeficiente Dice para detección de redundancia
 *  - Índice Fernández-Huerta para legibilidad
 *  - Diversidad léxica con índice de Guiraud
 *
 * Rúbrica TWR evalúa:
 *  1. Capacidad de Síntesis: densidad conceptual (TF-IDF) + redundancia (Dice)
 *  2. Cohesión y Gramática: coherencia inter-oraciones + conectores discursivos
 *  3. Claridad y Comprensión: legibilidad Fernández-Huerta + diversidad Guiraud
 *  4. Adaptación al Público: balance terminológico + complejidad apropiada
 */
@Injectable()
export class WrittenCommunicationService {
  constructor(private readonly nlp: NlpService) {}
  // ─── Technical vocabulary corpus ───────────────────────────────
  private readonly TECH_TERMS = [
    'arquitectura', 'microservicio', 'api', 'endpoint', 'base de datos',
    'servidor', 'escalabilidad', 'contenedor', 'docker', 'kubernetes',
    'latencia', 'throughput', 'sql', 'rest', 'http', 'framework',
    'patrón', 'módulo', 'componente', 'protocolo', 'seguridad',
    'inyección', 'vulnerabilidad', 'autenticación', 'cifrado', 'firewall',
    'incidente', 'sistema', 'red', 'log', 'monitoreo',
    'algoritmo', 'software', 'hardware', 'interfaz', 'compilador',
    'runtime', 'frontend', 'backend', 'devops', 'cloud',
    'tcp', 'dns', 'vpn', 'gateway', 'routing',
    'nosql', 'mongodb', 'postgresql', 'índice', 'query',
    'normalización', 'transacción', 'replicación', 'sharding',
    'optimización', 'implementación', 'integración', 'iteración',
    'prototipo', 'testing', 'deploy', 'pipeline', 'sprint',
    'requisito', 'especificación', 'abstracción', 'encapsulamiento',
    'herencia', 'polimorfismo', 'recursión', 'concurrencia',
    'token', 'hash', 'middleware', 'websocket', 'graphql',
    'refactoring', 'debugging', 'caché', 'code review',
  ];

  // ─── Discourse connectors (spaCy–inspired dependency markers) ──
  private readonly CONNECTORS = {
    additive: ['además', 'también', 'asimismo', 'igualmente', 'de igual manera', 'por otra parte', 'adicionalmente'],
    causal: ['porque', 'ya que', 'debido a', 'por lo tanto', 'en consecuencia', 'como resultado', 'dado que', 'por esta razón'],
    contrastive: ['sin embargo', 'no obstante', 'aunque', 'a pesar de', 'por el contrario', 'en cambio', 'mientras que'],
    sequential: ['primero', 'segundo', 'tercero', 'finalmente', 'en primer lugar', 'a continuación', 'posteriormente', 'luego', 'por último'],
    conclusive: ['en conclusión', 'para concluir', 'en resumen', 'en síntesis', 'en definitiva', 'para finalizar'],
    exemplification: ['por ejemplo', 'es decir', 'en otras palabras', 'tal como', 'esto significa', 'cabe destacar'],
  };

  // ─── Filler / redundant expressions ────────────────────────────
  private readonly FILLER_EXPRESSIONS = [
    'en mi opinión personal', 'básicamente', 'literalmente',
    'como ya mencioné', 'como ya se dijo', 'como es sabido',
    'cabe mencionar que', 'hay que tener en cuenta que',
    'es importante mencionar', 'vale la pena señalar',
    'dicho lo anterior', 'en este sentido',
    'es necesario recalcar', 'como se puede observar',
  ];

  // ─── Key concept terms for synthesis analysis ──────────────────
  private readonly KEY_CONCEPT_INDICATORS = [
    'concepto', 'principio', 'método', 'técnica', 'estrategia',
    'proceso', 'modelo', 'teoría', 'hipótesis', 'resultado',
    'conclusión', 'hallazgo', 'evidencia', 'dato', 'variable',
    'causa', 'efecto', 'factor', 'criterio', 'indicador',
    'objetivo', 'meta', 'requisito', 'estándar', 'norma',
  ];

  /**
   * Evalúa un texto escrito contra la rúbrica TWR.
   * Retorna calificación numérica, desglose por categoría,
   * y sugerencias de edición para mejorar la economía del lenguaje.
   */
  evaluate(
    text: string,
    criteria: { id: string; label: string; weight: number }[],
    wordLimit?: { min: number; max: number },
  ): TwrEvaluationResult {
    // ─── Text statistics (spaCy-style tokenization) ───────────
    const stats = this.computeStats(text);

    // ─── Synthesis analysis ───────────────────────────────────
    const synthesisAnalysis = this.analyzeSynthesis(text, stats, wordLimit);

    // ─── Cohesion analysis ────────────────────────────────────
    const cohesionAnalysis = this.analyzeCohesion(text, stats);

    // ─── Text issues ──────────────────────────────────────────
    const issues = this.detectIssues(text, stats, wordLimit);

    // ─── Score each criterion ─────────────────────────────────
    const criteriaScores: TwrCriterionScore[] = criteria.map((c) =>
      this.scoreCriterion(c, stats, synthesisAnalysis, cohesionAnalysis),
    );

    // ─── Weighted total ───────────────────────────────────────
    const totalWeight = criteriaScores.reduce((s, c) => s + c.weight, 0);
    const totalScore = totalWeight > 0
      ? Math.round(criteriaScores.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0))
      : 0;

    // ─── Editing suggestions ──────────────────────────────────
    const editingSuggestions = this.generateEditingSuggestions(stats, synthesisAnalysis, cohesionAnalysis, issues);

    // ─── Recommendations ──────────────────────────────────────
    const recommendations = this.generateRecommendations(criteriaScores, issues);

    // ─── Length penalty for very short texts ──────────────────
    const lengthPenaltyApplied = stats.wordCount < 30;
    let finalScore = totalScore;
    if (lengthPenaltyApplied) {
      const penaltyFactor = Math.max(0.3, stats.wordCount / 30);
      finalScore = Math.round(totalScore * penaltyFactor);
      criteriaScores.forEach((c) => {
        c.score = Math.round(c.score * penaltyFactor);
        c.level = this.scoreToLevel(c.score);
      });
    }

    // ─── Build NLP details for frontend ───────────────────────
    const termAnalysis = this.nlp.detectTerms(text, this.TECH_TERMS, this.nlp.tokenize(text).words);
    const lowerText = text.toLowerCase();
    const allConns = Object.values(this.CONNECTORS).flat();
    const connectorsUsedList = allConns.filter((c) => lowerText.includes(c));
    const nlpDetails: TwrNlpDetails = {
      wordCount: stats.wordCount,
      sentenceCount: stats.sentenceCount,
      paragraphCount: stats.paragraphCount,
      techTermsFound: [...termAnalysis.exactMatches, ...termAnalysis.fuzzyMatches.map((f) => f.term)],
      techTermCount: termAnalysis.totalFound,
      connectorsUsed: connectorsUsedList,
      connectorsCount: stats.connectorsCount,
      guiraudIndex: stats.guiraudIndex,
      fernandezHuerta: stats.fernandezHuerta,
      complexityLevel: stats.complexityLevel,
      uniqueWordRatio: stats.uniqueWordRatio,
      lexicalDensity: Math.round(stats.lexicalDensity * 100),
      redundancyIndex: synthesisAnalysis.redundancyIndex,
      conceptDensity: synthesisAnalysis.conceptDensity,
      lengthPenaltyApplied,
    };

    return {
      score: finalScore,
      criteriaScores,
      stats,
      synthesisAnalysis,
      cohesionAnalysis,
      issues,
      recommendations,
      editingSuggestions,
      kolbPhase: this.mapKolbPhase(finalScore),
      nlpDetails,
    };
  }

  // ─── Text Statistics (NLP-powered tokenization) ────────────────

  private computeStats(text: string): WrittenTextStats & {
    guiraudIndex: number;
    fernandezHuerta: number;
    complexityLevel: string;
  } {
    const tokenized = this.nlp.tokenize(text);
    const { words, sentences, paragraphs, wordCount, sentenceCount, paragraphCount } = tokenized;

    const avgWordsPerSentence = sentenceCount > 0
      ? Math.round((wordCount / sentenceCount) * 10) / 10
      : 0;

    // Detección de términos técnicos con TF-IDF + Jaro-Winkler
    const termAnalysis = this.nlp.detectTerms(text, this.TECH_TERMS, words);
    const techTermCount = termAnalysis.totalFound;

    // Diversidad léxica con stemming (Guiraud, TTR)
    const diversity = this.nlp.computeLexicalDiversity(words);
    const uniqueWordRatio = diversity.ttr;

    // Conectores discursivos
    const allConnectors = Object.values(this.CONNECTORS).flat();
    const lowerText = text.toLowerCase();
    const connectorsCount = allConnectors.filter((c) => lowerText.includes(c)).length;

    // Densidad léxica: palabras de contenido / total (con stemming para stop words)
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del',
      'en', 'y', 'o', 'a', 'al', 'es', 'son', 'fue', 'ser', 'ha', 'han',
      'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'este', 'esta',
      'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'no', 'si', 'más',
      'pero', 'como', 'ya', 'lo', 'le', 'me', 'te', 'nos', 'les',
      'muy', 'tan', 'entre', 'sobre', 'sin', 'hasta', 'desde', 'donde',
    ]);
    const contentWords = words.filter((w) => !stopWords.has(w.toLowerCase()) && w.length > 2);
    const lexicalDensity = words.length > 0
      ? Math.round((contentWords.length / words.length) * 100) / 100
      : 0;

    // Legibilidad Fernández-Huerta
    const readability = this.nlp.computeReadability(text, words, sentences);

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      paragraphCount,
      techTermCount,
      uniqueWordRatio,
      connectorsCount,
      lexicalDensity,
      // Métricas NLP extendidas
      guiraudIndex: diversity.guiraud,
      fernandezHuerta: readability.fernandezHuerta,
      complexityLevel: readability.complexityLevel,
    };
  }

  // ─── Synthesis Analysis (NLP: TF-IDF + Redundancy Detection) ──

  private analyzeSynthesis(
    text: string,
    stats: WrittenTextStats,
    wordLimit?: { min: number; max: number },
  ): SynthesisAnalysis {
    const tokenized = this.nlp.tokenize(text);
    const { words, sentences } = tokenized;

    // Detección de conceptos clave basada en TF-IDF + Jaro-Winkler
    const termAnalysis = this.nlp.detectTerms(text, this.KEY_CONCEPT_INDICATORS, words);
    const keyConceptsFound = termAnalysis.totalFound + stats.techTermCount;

    // Densidad conceptual: conceptos clave por cada 100 palabras
    const conceptDensity = stats.wordCount > 0
      ? Math.round((keyConceptsFound / stats.wordCount) * 1000) / 10
      : 0;

    // Verificación de límite de palabras
    const withinLimits = wordLimit
      ? stats.wordCount >= wordLimit.min && stats.wordCount <= wordLimit.max
      : stats.wordCount <= 500;

    // Detección de redundancia con Dice coefficient + muletillas
    const redundancy = this.nlp.detectRedundancy(sentences, this.FILLER_EXPRESSIONS);
    const redundancyIndex = Math.round(
      ((redundancy.fillerCount * 2 + redundancy.redundantPairs.length) /
        Math.max(stats.sentenceCount, 1)) * 100,
    ) / 100;

    // Puntuación de síntesis — rigorous: base 15, must earn points
    let score = 15;
    if (withinLimits) score += 20;
    else score += 5;
    if (conceptDensity >= 5) score += 25;
    else if (conceptDensity >= 3) score += 18;
    else if (conceptDensity >= 1.5) score += 10;
    else if (conceptDensity >= 0.5) score += 4;
    if (redundancyIndex < 0.3) score += 20;
    else if (redundancyIndex < 0.5) score += 14;
    else if (redundancyIndex < 1) score += 6;
    if (stats.lexicalDensity >= 0.55) score += 15;
    else if (stats.lexicalDensity >= 0.45) score += 10;
    else if (stats.lexicalDensity >= 0.35) score += 5;
    // bonus for rich concept count
    if (keyConceptsFound >= 10) score += 5;
    score = this.clamp(score);

    let feedback: string;
    if (score >= 85) {
      feedback = `Excelente capacidad de síntesis. Densidad conceptual: ${conceptDensity} conceptos/100 palabras. Redundancia mínima (${redundancyIndex}).`;
    } else if (score >= 70) {
      feedback = `Buena síntesis. Densidad: ${conceptDensity} conceptos/100 palabras. Hay oportunidad de reducir redundancia (índice: ${redundancyIndex}).`;
    } else if (score >= 50) {
      feedback = `Síntesis aceptable pero mejorable. ${!withinLimits ? 'El texto no cumple los límites de extensión. ' : ''}Busca concentrar más conceptos clave en menos palabras.`;
    } else {
      feedback = `La capacidad de síntesis necesita trabajo significativo. El texto es ${stats.wordCount > (wordLimit?.max ?? 500) ? 'demasiado extenso' : 'poco denso en conceptos'}. Enfócate en retener los conceptos esenciales y eliminar información superflua.`;
    }

    return { conceptDensity, withinLimits, keyConceptsFound, redundancyIndex, score, feedback };
  }

  // ─── Cohesion Analysis (NLP: Dice coherence + connector diversity) ──

  private analyzeCohesion(text: string, stats: WrittenTextStats): CohesionAnalysis {
    const tokenized = this.nlp.tokenize(text);
    const { sentences } = tokenized;

    // Análisis de coherencia basado en Dice coefficient entre oraciones consecutivas
    const coherence = this.nlp.analyzeCoherence(sentences, this.CONNECTORS, text);

    // Conectores usados (con categoría)
    const lowerText = text.toLowerCase();
    const allConnectors = Object.entries(this.CONNECTORS);
    const connectorsUsed: string[] = [];
    const categoriesUsed = new Set<string>();
    for (const [category, connectors] of allConnectors) {
      for (const c of connectors) {
        if (lowerText.includes(c)) {
          connectorsUsed.push(c);
          categoriesUsed.add(category);
        }
      }
    }

    // Puntuación de transición — rigorous: base 10
    const categoriesUsedCount = Object.values(coherence.connectorTypes).filter((v) => v > 0).length;
    const connectorDiversityRatio = Object.keys(coherence.connectorTypes).length > 0
      ? categoriesUsedCount / Object.keys(coherence.connectorTypes).length
      : 0;
    const transitionScore = this.clamp(
      10 + categoriesUsed.size * 12 + Math.min(connectorsUsed.length * 4, 20) +
      connectorDiversityRatio * 25,
    );

    // Flujo — rigorous: base 10
    const flowScore = this.clamp(
      10 + coherence.avgSentenceSimilarity * 90,
    );

    // Calidad estructural — rigorous: base 15
    const fillerCount = this.FILLER_EXPRESSIONS.filter((f) => lowerText.includes(f)).length;
    const structureQuality = this.clamp(
      15 +
      (stats.paragraphCount >= 4 ? 25 : stats.paragraphCount >= 3 ? 18 : stats.paragraphCount >= 2 ? 10 : 0) +
      (categoriesUsed.size >= 4 ? 20 : categoriesUsed.size >= 3 ? 14 : categoriesUsed.size >= 2 ? 8 : 0) +
      (fillerCount === 0 ? 18 : fillerCount <= 1 ? 10 : fillerCount <= 2 ? 4 : 0) +
      (stats.avgWordsPerSentence >= 12 && stats.avgWordsPerSentence <= 25 ? 12 : stats.avgWordsPerSentence >= 8 ? 5 : 0),
    );

    const score = Math.round((transitionScore + flowScore + structureQuality) / 3);

    let feedback: string;
    if (score >= 85) {
      feedback = `Excelente cohesión textual. Coherencia entre oraciones: ${Math.round(coherence.avgSentenceSimilarity * 100)}%. Uso de ${categoriesUsed.size} categorías de conectores.`;
    } else if (score >= 70) {
      feedback = `Buena cohesión (coherencia: ${Math.round(coherence.avgSentenceSimilarity * 100)}%). Conectores: ${connectorsUsed.length} (${categoriesUsed.size} categorías). Mejora las transiciones entre párrafos.`;
    } else if (score >= 50) {
      feedback = `Cohesión aceptable. Coherencia semántica: ${Math.round(coherence.avgSentenceSimilarity * 100)}%. Necesitas más variedad de conectores discursivos.`;
    } else {
      feedback = `La cohesión necesita mejora significativa. Las ideas aparecen desconectadas (coherencia: ${Math.round(coherence.avgSentenceSimilarity * 100)}%). Aplica el proceso de escritura multinivel.`;
    }

    return { connectorsUsed, transitionScore, flowScore, structureQuality, score, feedback };
  }

  // ─── Issue Detection ───────────────────────────────────────────

  private detectIssues(
    text: string,
    stats: WrittenTextStats & { guiraudIndex: number; fernandezHuerta: number; complexityLevel: string },
    wordLimit?: { min: number; max: number },
  ): TextIssue[] {
    const issues: TextIssue[] = [];
    const lowerText = text.toLowerCase();

    // Word limit validation
    if (wordLimit) {
      if (stats.wordCount < wordLimit.min) {
        issues.push({
          type: 'warning',
          category: 'length',
          message: `El texto tiene ${stats.wordCount} palabras, por debajo del mínimo requerido de ${wordLimit.min}. Desarrolla más los puntos clave.`,
        });
      } else if (stats.wordCount > wordLimit.max) {
        issues.push({
          type: 'warning',
          category: 'length',
          message: `El texto tiene ${stats.wordCount} palabras, excede el máximo de ${wordLimit.max}. Aplica síntesis: elimina información redundante.`,
        });
      } else {
        issues.push({
          type: 'success',
          category: 'length',
          message: `Longitud adecuada: ${stats.wordCount} palabras dentro del rango ${wordLimit.min}-${wordLimit.max}.`,
        });
      }
    }

    // Sentence complexity
    if (stats.avgWordsPerSentence > 30) {
      issues.push({
        type: 'warning',
        category: 'grammar',
        message: `Oraciones excesivamente largas (promedio: ${stats.avgWordsPerSentence} palabras). La escritura técnica eficaz usa oraciones de 15-25 palabras.`,
      });
    } else if (stats.avgWordsPerSentence >= 12 && stats.avgWordsPerSentence <= 25) {
      issues.push({
        type: 'success',
        category: 'grammar',
        message: `Buena longitud promedio de oraciones (${stats.avgWordsPerSentence} palabras) para escritura técnica.`,
      });
    } else if (stats.avgWordsPerSentence < 8 && stats.sentenceCount > 2) {
      issues.push({
        type: 'info',
        category: 'grammar',
        message: `Oraciones muy cortas (promedio: ${stats.avgWordsPerSentence} palabras). Considera desarrollar más las ideas con explicaciones y evidencia.`,
      });
    }

    // Technical vocabulary
    if (stats.techTermCount >= 8) {
      issues.push({ type: 'success', category: 'vocabulary', message: `Excelente uso de vocabulario técnico: ${stats.techTermCount} términos especializados.` });
    } else if (stats.techTermCount >= 4) {
      issues.push({ type: 'success', category: 'vocabulary', message: `Buen uso de vocabulario técnico: ${stats.techTermCount} términos identificados.` });
    } else if (stats.techTermCount < 2) {
      issues.push({ type: 'info', category: 'vocabulary', message: 'Incorpora más terminología técnica específica del dominio para reforzar la precisión.', });
    }

    // Paragraph structure
    if (stats.paragraphCount >= 3) {
      issues.push({ type: 'success', category: 'structure', message: 'Texto bien organizado en párrafos diferenciados.' });
    } else if (stats.paragraphCount === 1) {
      issues.push({ type: 'warning', category: 'structure', message: 'El texto es un solo bloque. Divide en párrafos: introducción, desarrollo y conclusión.' });
    }

    // Filler detection
    const fillersFound = this.FILLER_EXPRESSIONS.filter((f) => lowerText.includes(f));
    if (fillersFound.length > 0) {
      issues.push({
        type: 'warning',
        category: 'synthesis',
        message: `Expresiones superfluas detectadas (${fillersFound.length}): "${fillersFound.slice(0, 3).join('", "')}". Elimínalas para mejorar la economía del lenguaje.`,
      });
    }

    // Lexical diversity (Guiraud index)
    if (stats.guiraudIndex < 3) {
      issues.push({ type: 'warning', category: 'vocabulary', message: `Baja diversidad léxica (Guiraud: ${stats.guiraudIndex.toFixed(1)}). Evita repetir las mismas palabras; usa sinónimos y pronombres.` });
    } else if (stats.guiraudIndex >= 5) {
      issues.push({ type: 'success', category: 'vocabulary', message: `Alta diversidad léxica (Guiraud: ${stats.guiraudIndex.toFixed(1)}), indicando vocabulario rico y variado.` });
    }

    // Readability (Fernández-Huerta)
    if (stats.fernandezHuerta < 30) {
      issues.push({ type: 'info', category: 'grammar', message: `Legibilidad baja (Fernández-Huerta: ${Math.round(stats.fernandezHuerta)}). Nivel: ${stats.complexityLevel}. Simplifica la estructura de las oraciones.` });
    } else if (stats.fernandezHuerta >= 70) {
      issues.push({ type: 'success', category: 'grammar', message: `Buena legibilidad (Fernández-Huerta: ${Math.round(stats.fernandezHuerta)}). Nivel: ${stats.complexityLevel}.` });
    }

    return issues;
  }

  // ─── Criterion Scoring ─────────────────────────────────────────

  private scoreCriterion(
    criterion: { id: string; label: string; weight: number },
    stats: WrittenTextStats & { guiraudIndex: number; fernandezHuerta: number; complexityLevel: string },
    synthesis: SynthesisAnalysis,
    cohesion: CohesionAnalysis,
  ): TwrCriterionScore {
    const cId = (criterion.id || criterion.label).toLowerCase();
    let score: number;
    let feedback: string;

    if (cId.includes('síntesis') || cId.includes('sintesis') || cId.includes('synthesis')) {
      score = synthesis.score;
      feedback = synthesis.feedback;

    } else if (cId.includes('cohesión') || cId.includes('cohesion') || cId.includes('gramática') || cId.includes('gramatica')) {
      score = cohesion.score;
      feedback = cohesion.feedback;

    } else if (cId.includes('claridad') || cId.includes('comprensión') || cId.includes('comprension')) {
      // Claridad — rigorous: base 15
      const fh = stats.fernandezHuerta;
      const readabilityBonus = fh >= 70 ? 25 : fh >= 50 ? 16 : fh >= 30 ? 8 : 0;
      const guiraudBonus = stats.guiraudIndex >= 6 ? 20 : stats.guiraudIndex >= 5 ? 14 : stats.guiraudIndex >= 3.5 ? 8 : stats.guiraudIndex >= 2.5 ? 3 : 0;
      const techBonus = Math.min(stats.techTermCount * 2, 20);
      const densityBonus = stats.lexicalDensity >= 0.55 ? 12 : stats.lexicalDensity >= 0.45 ? 8 : stats.lexicalDensity >= 0.35 ? 4 : 0;
      score = this.clamp(15 + readabilityBonus + guiraudBonus + techBonus + densityBonus);
      feedback = score >= 80
        ? `Excelente claridad (legibilidad Fernández-Huerta: ${Math.round(fh)}). Las ideas se comunican con precisión.`
        : score >= 60
          ? `Claridad aceptable (legibilidad: ${Math.round(fh)}). Simplifica oraciones complejas para mayor comprensión.`
          : `La claridad necesita mejora (legibilidad: ${Math.round(fh)}). Reestructura oraciones largas y define términos técnicos.`;

    } else if (cId.includes('adaptación') || cId.includes('adaptacion') || cId.includes('público') || cId.includes('publico')) {
      // Adaptación — rigorous: base 15
      const fh = stats.fernandezHuerta;
      const readabilityBonus = fh >= 50 && fh <= 80 ? 20 : fh >= 30 ? 10 : 0;
      const techBalance = stats.techTermCount >= 5 && stats.techTermCount <= 20 ? 20 : stats.techTermCount >= 3 ? 12 : stats.techTermCount >= 1 ? 5 : 0;
      const structureBonus = stats.paragraphCount >= 4 ? 18 : stats.paragraphCount >= 3 ? 14 : stats.paragraphCount >= 2 ? 7 : 0;
      const sentenceLenBonus = stats.avgWordsPerSentence >= 12 && stats.avgWordsPerSentence <= 25 ? 12 : stats.avgWordsPerSentence >= 8 ? 5 : 0;
      score = this.clamp(15 + readabilityBonus + techBalance + structureBonus + sentenceLenBonus);
      feedback = score >= 80
        ? 'Excelente adaptación al público técnico. Nivel de formalidad y complejidad apropiado.'
        : score >= 60
          ? 'Adaptación adecuada. Calibra el equilibrio entre tecnicismos y explicaciones accesibles.'
          : 'El texto no se adapta bien a la audiencia. Equilibra complejidad técnica con claridad expositiva.';

    } else if (cId.includes('estructura') || cId.includes('coherencia') || cId.includes('organización') || cId.includes('organizacion')) {
      // Estructura — rigorous: base 15
      const paragraphScore = stats.paragraphCount >= 4 ? 25 : stats.paragraphCount >= 3 ? 18 : stats.paragraphCount >= 2 ? 10 : 0;
      const connectorScore = Math.min(stats.connectorsCount * 4, 25);
      const sentenceScore = Math.min(stats.sentenceCount * 2, 15);
      const avgLenBonus = stats.avgWordsPerSentence >= 12 && stats.avgWordsPerSentence <= 25 ? 10 : 0;
      score = this.clamp(15 + paragraphScore + connectorScore + sentenceScore + avgLenBonus);
      feedback = score >= 80
        ? 'Estructura sólida con párrafos bien organizados y transiciones claras.'
        : score >= 60
          ? 'Estructura aceptable. Mejora las transiciones entre párrafos y usa más conectores.'
          : 'La estructura es débil. Organiza el texto en párrafos claros con introducción, desarrollo y conclusión.';

    } else {
      // Generic fallback — rigorous: base 20
      score = this.clamp(20 + Math.min(stats.wordCount / 10, 20) + Math.min(stats.sentenceCount * 2, 15) + (stats.techTermCount > 5 ? 15 : stats.techTermCount > 3 ? 10 : stats.techTermCount > 0 ? 4 : 0) + (stats.paragraphCount >= 3 ? 10 : 0));
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

  // ─── Editing Suggestions ───────────────────────────────────────

  private generateEditingSuggestions(
    stats: WrittenTextStats,
    synthesis: SynthesisAnalysis,
    cohesion: CohesionAnalysis,
    issues: TextIssue[],
  ): string[] {
    const suggestions: string[] = [];

    // Synthesis-based suggestions
    if (synthesis.redundancyIndex > 0.5) {
      suggestions.push('Elimina frases repetitivas y expresiones de relleno. Cada oración debe aportar información nueva.');
    }
    if (!synthesis.withinLimits) {
      suggestions.push('Ajusta la extensión del texto al límite establecido. Prioriza los conceptos clave y elimina detalles secundarios.');
    }
    if (synthesis.conceptDensity < 1.5) {
      suggestions.push('Aumenta la densidad conceptual: incluye más términos técnicos y conceptos clave por párrafo.');
    }

    // Cohesion-based suggestions
    if (cohesion.transitionScore < 60) {
      suggestions.push('Mejora las transiciones: inicia cada párrafo con un conector que lo vincule al anterior (sin embargo, además, por lo tanto).');
    }
    if (cohesion.flowScore < 60) {
      suggestions.push('Equilibra la longitud de las oraciones. Alterna entre oraciones cortas (afirmaciones directas) y largas (explicaciones detalladas).');
    }
    if (cohesion.structureQuality < 60) {
      suggestions.push('Aplica el proceso de escritura multinivel: 1) Planifica un esquema, 2) Redacta el borrador, 3) Revisa eliminando redundancia.');
    }

    // Grammar-based suggestions from issues
    const warnings = issues.filter((i) => i.type === 'warning');
    for (const w of warnings.slice(0, 2)) {
      if (!suggestions.some((s) => s.includes(w.message.substring(0, 20)))) {
        suggestions.push(w.message);
      }
    }

    // Vocabulary suggestions
    if (stats.uniqueWordRatio < 0.35) {
      suggestions.push('Diversifica tu vocabulario: reemplaza palabras repetidas con sinónimos o reformulaciones.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Excelente escritura técnica. Para seguir mejorando, experimenta con estructuras argumentativas más complejas.');
    }

    return suggestions;
  }

  // ─── Recommendations ───────────────────────────────────────────

  private generateRecommendations(
    criteriaScores: TwrCriterionScore[],
    issues: TextIssue[],
  ): string[] {
    const recs: string[] = [];
    const sorted = [...criteriaScores].sort((a, b) => a.score - b.score);

    for (const c of sorted.slice(0, 2)) {
      if (c.score < 75) {
        recs.push(`[${c.label}] Puntuación ${c.score}/100: ${c.feedback}`);
      }
    }

    const infoIssues = issues.filter((i) => i.type === 'info');
    for (const info of infoIssues.slice(0, 2)) {
      recs.push(info.message);
    }

    if (recs.length === 0) {
      recs.push('Excelente trabajo. Sigue practicando para consolidar tus habilidades de escritura técnica y síntesis.');
    }

    return recs;
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
