/**
 * NLP Service — Motor de Procesamiento de Lenguaje Natural
 *
 * Utiliza la librería 'natural' (v8+) para proporcionar análisis
 * lingüístico real sobre textos en español:
 *
 *  - Tokenización (WordTokenizer, SentenceTokenizer)
 *  - Stemming español (PorterStemmerEs)
 *  - TF-IDF para importancia de términos técnicos
 *  - Métricas de diversidad léxica (TTR, Guiraud, Hapax Legomena)
 *  - Índice de legibilidad Fernández-Huerta (adaptación española de Flesch)
 *  - Distancia de cadenas (Jaro-Winkler, Dice) para detección difusa
 *  - Análisis de coherencia y redundancia textual
 *
 * Referencia: Bird, Klein & Loper — NLP with Python (O'Reilly)
 */
import { Injectable } from '@nestjs/common';
import * as natural from 'natural';

// ─── Interfaces de resultados ────────────────────────────────────

export interface TokenizationResult {
  words: string[];
  sentences: string[];
  paragraphs: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
}

export interface LexicalDiversityResult {
  ttr: number;
  guiraud: number;
  hapaxLegomena: number;
  hapaxRatio: number;
}

export interface ReadabilityResult {
  avgSentenceLength: number;
  avgWordLength: number;
  avgSyllablesPerWord: number;
  fernandezHuerta: number;
  complexityLevel: string;
}

export interface TermAnalysisResult {
  exactMatches: string[];
  fuzzyMatches: { term: string; matched: string; similarity: number }[];
  totalFound: number;
  density: number;
  tfidfScores: Record<string, number>;
}

export interface CoherenceResult {
  avgSentenceSimilarity: number;
  connectorCount: number;
  connectorTypes: Record<string, number>;
  coherenceScore: number;
}

export interface RedundancyResult {
  redundantPairs: { sentence1: number; sentence2: number; similarity: number }[];
  redundancyScore: number;
  fillerCount: number;
}

// ─── Servicio NLP ────────────────────────────────────────────────

@Injectable()
export class NlpService {
  private wordTokenizer = new natural.WordTokenizer();

  // ─── Tokenización ──────────────────────────────────────────────

  /**
   * Tokeniza texto en palabras, oraciones y párrafos
   * usando tokenizadores de la librería 'natural'.
   */
  tokenize(text: string): TokenizationResult {
    const words = this.wordTokenizer.tokenize(text) || [];

    // Sentence tokenization: split on sentence-ending punctuation
    // natural's SentenceTokenizer can be unreliable for Spanish,
    // so we use a regex-based approach validated against NLP standards
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);

    return {
      words,
      sentences,
      paragraphs,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
    };
  }

  // ─── Stemming español (Porter Stemmer Es) ─────────────────────

  stem(word: string): string {
    return natural.PorterStemmerEs.stem(word.toLowerCase());
  }

  stemAll(words: string[]): string[] {
    return words.map((w) => natural.PorterStemmerEs.stem(w.toLowerCase()));
  }

  // ─── Diversidad léxica ─────────────────────────────────────────

  /**
   * Calcula métricas de diversidad léxica usando stemming:
   * - TTR (Type-Token Ratio): tokens únicos / total
   * - Índice de Guiraud: tipos / sqrt(tokens)
   * - Hapax Legomena: palabras que aparecen exactamente una vez
   */
  computeLexicalDiversity(words: string[]): LexicalDiversityResult {
    const totalWords = words.length;
    if (totalWords === 0) {
      return { ttr: 0, guiraud: 0, hapaxLegomena: 0, hapaxRatio: 0 };
    }

    const stems = this.stemAll(words);
    const freq = new Map<string, number>();
    for (const s of stems) {
      freq.set(s, (freq.get(s) || 0) + 1);
    }

    const uniqueStems = freq.size;
    const hapaxLegomena = Array.from(freq.values()).filter((v) => v === 1).length;

    return {
      ttr: Math.round((uniqueStems / totalWords) * 100) / 100,
      guiraud: Math.round((uniqueStems / Math.sqrt(totalWords)) * 100) / 100,
      hapaxLegomena,
      hapaxRatio:
        uniqueStems > 0
          ? Math.round((hapaxLegomena / uniqueStems) * 100) / 100
          : 0,
    };
  }

  // ─── Legibilidad (Fernández-Huerta para español) ──────────────

  /**
   * Calcula el índice de legibilidad Fernández-Huerta,
   * adaptación española de la fórmula Flesch:
   *
   *   FH = 206.84 − 60 × (sílabas/palabras) − 1.02 × (palabras/oraciones)
   *
   * Rango: 0–100 (mayor = más legible).
   */
  computeReadability(
    text: string,
    words: string[],
    sentences: string[],
  ): ReadabilityResult {
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    if (wordCount === 0 || sentenceCount === 0) {
      return {
        avgSentenceLength: 0,
        avgWordLength: 0,
        avgSyllablesPerWord: 0,
        fernandezHuerta: 0,
        complexityLevel: 'insuficiente',
      };
    }

    const avgSentenceLength = wordCount / sentenceCount;
    const avgWordLength =
      words.reduce((sum, w) => sum + w.length, 0) / wordCount;

    const totalSyllables = words.reduce(
      (sum, w) => sum + this.countSyllables(w),
      0,
    );
    const avgSyllablesPerWord = totalSyllables / wordCount;

    // Fórmula Fernández-Huerta
    const fernandezHuerta = Math.max(
      0,
      Math.min(100, 206.84 - 60 * avgSyllablesPerWord - 1.02 * avgSentenceLength),
    );

    let complexityLevel: string;
    if (fernandezHuerta >= 80) complexityLevel = 'muy fácil';
    else if (fernandezHuerta >= 60) complexityLevel = 'fácil';
    else if (fernandezHuerta >= 40) complexityLevel = 'normal';
    else if (fernandezHuerta >= 20) complexityLevel = 'difícil';
    else complexityLevel = 'muy difícil';

    return {
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
      fernandezHuerta: Math.round(fernandezHuerta * 10) / 10,
      complexityLevel,
    };
  }

  // ─── Detección de términos técnicos (TF-IDF + Jaro-Winkler) ───

  /**
   * Detecta términos técnicos usando:
   * 1. Coincidencia exacta (substring matching)
   * 2. Coincidencia difusa con Jaro-Winkler (umbral 0.85)
   * 3. Puntuación TF-IDF para relevancia del término
   */
  detectTerms(
    text: string,
    corpus: string[],
    words: string[],
  ): TermAnalysisResult {
    const lowerText = text.toLowerCase();
    const wordCount = words.length;

    // Coincidencias exactas
    const exactMatches = corpus.filter((term) =>
      lowerText.includes(term.toLowerCase()),
    );

    // Coincidencias difusas con Jaro-Winkler
    const lowerWords = words.map((w) => w.toLowerCase());
    const fuzzyMatches: { term: string; matched: string; similarity: number }[] = [];

    for (const term of corpus) {
      if (exactMatches.includes(term)) continue;
      if (term.includes(' ')) continue; // Solo términos de una palabra para fuzzy

      for (const word of lowerWords) {
        if (word.length < 3) continue;
        const similarity = natural.JaroWinklerDistance(
          term.toLowerCase(),
          word,
        );
        if (similarity >= 0.85) {
          fuzzyMatches.push({
            term,
            matched: word,
            similarity: Math.round(similarity * 100) / 100,
          });
          break;
        }
      }
    }

    // TF-IDF para importancia de cada término
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(lowerText);

    const tfidfScores: Record<string, number> = {};
    for (const term of [
      ...exactMatches,
      ...fuzzyMatches.map((f) => f.term),
    ]) {
      const termWords = term.split(' ');
      const score =
        termWords.reduce((sum, w) => sum + (tfidf.tfidf(w, 0) || 0), 0) /
        termWords.length;
      tfidfScores[term] = Math.round(score * 100) / 100;
    }

    const totalFound = exactMatches.length + fuzzyMatches.length;

    return {
      exactMatches,
      fuzzyMatches,
      totalFound,
      density:
        wordCount > 0
          ? Math.round((totalFound / wordCount) * 1000) / 10
          : 0,
      tfidfScores,
    };
  }

  // ─── Análisis de coherencia textual ────────────────────────────

  /**
   * Evalúa coherencia textual mediante:
   * - Conteo de conectores discursivos por categoría
   * - Similitud entre oraciones consecutivas (coef. Dice con stemming)
   */
  analyzeCoherence(
    sentences: string[],
    connectorCategories: Record<string, string[]>,
    text: string,
  ): CoherenceResult {
    const lowerText = text.toLowerCase();

    // Conteo de conectores por categoría
    const connectorTypes: Record<string, number> = {};
    let totalConnectors = 0;

    for (const [category, connectors] of Object.entries(connectorCategories)) {
      const count = connectors.filter((c) => lowerText.includes(c)).length;
      connectorTypes[category] = count;
      totalConnectors += count;
    }

    // Similitud entre oraciones consecutivas usando Dice con stemming
    let totalSimilarity = 0;
    let pairs = 0;

    for (let i = 0; i < sentences.length - 1; i++) {
      const wordsA = new Set(
        this.stemAll(this.wordTokenizer.tokenize(sentences[i]) || []),
      );
      const wordsB = new Set(
        this.stemAll(this.wordTokenizer.tokenize(sentences[i + 1]) || []),
      );

      if (wordsA.size === 0 || wordsB.size === 0) continue;

      const intersection = new Set(
        [...wordsA].filter((w) => wordsB.has(w)),
      );
      const dice = (2 * intersection.size) / (wordsA.size + wordsB.size);
      totalSimilarity += dice;
      pairs++;
    }

    const avgSimilarity =
      pairs > 0 ? Math.round((totalSimilarity / pairs) * 100) / 100 : 0;

    // Puntaje de coherencia: conectores + similitud + diversidad
    const connectorScore = Math.min(totalConnectors * 5, 40);
    const similarityScore = avgSimilarity * 40;
    const categoriesUsed = Object.values(connectorTypes).filter(
      (v) => v > 0,
    ).length;
    const diversityScore = Math.min(categoriesUsed * 5, 20);

    return {
      avgSentenceSimilarity: avgSimilarity,
      connectorCount: totalConnectors,
      connectorTypes,
      coherenceScore: Math.min(
        100,
        Math.round(connectorScore + similarityScore + diversityScore),
      ),
    };
  }

  // ─── Detección de redundancia ──────────────────────────────────

  /**
   * Detecta contenido redundante usando:
   * - Coeficiente Dice entre pares de oraciones (umbral > 0.6)
   * - Conteo de expresiones de relleno
   */
  detectRedundancy(
    sentences: string[],
    fillerExpressions: string[],
  ): RedundancyResult {
    const lowerSentences = sentences.map((s) => s.toLowerCase());

    const redundantPairs: {
      sentence1: number;
      sentence2: number;
      similarity: number;
    }[] = [];

    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = natural.DiceCoefficient(
          lowerSentences[i],
          lowerSentences[j],
        );
        if (similarity > 0.6) {
          redundantPairs.push({
            sentence1: i,
            sentence2: j,
            similarity: Math.round(similarity * 100) / 100,
          });
        }
      }
    }

    // Conteo de expresiones de relleno
    const fullText = lowerSentences.join(' ');
    const fillerCount = fillerExpressions.filter((f) =>
      fullText.includes(f.toLowerCase()),
    ).length;

    const pairPenalty = Math.min(redundantPairs.length * 15, 50);
    const fillerPenalty = Math.min(fillerCount * 8, 30);

    return {
      redundantPairs,
      redundancyScore: Math.min(100, pairPenalty + fillerPenalty),
      fillerCount,
    };
  }

  // ─── Distancia de cadenas ──────────────────────────────────────

  jaroWinkler(a: string, b: string): number {
    return natural.JaroWinklerDistance(a, b);
  }

  dice(a: string, b: string): number {
    return natural.DiceCoefficient(a, b);
  }

  // ─── Helpers ───────────────────────────────────────────────────

  /**
   * Cuenta sílabas en una palabra española.
   * Heurística basada en grupos vocálicos de la fonología española.
   */
  private countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
    if (w.length <= 2) return 1;

    const vowels = 'aeiouáéíóúü';
    let count = 0;
    let prevVowel = false;

    for (const ch of w) {
      const isVowel = vowels.includes(ch);
      if (isVowel && !prevVowel) count++;
      prevVowel = isVowel;
    }

    return Math.max(1, count);
  }
}
