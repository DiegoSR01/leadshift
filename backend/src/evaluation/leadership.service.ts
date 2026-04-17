import { Injectable } from '@nestjs/common';
import {
  MaturityLevel,
  LeadershipStyle,
  LeadershipEvaluationResult,
} from './interfaces/rubric.interfaces';

/**
 * Motor de Diagnóstico de Liderazgo Situacional
 * basado en el modelo de Hersey & Blanchard.
 *
 * Evalúa la capacidad del estudiante de seleccionar el estilo correcto
 * de liderazgo (S1-S4) según la madurez del seguidor (M1-M4).
 *
 * Matriz de efectividad:
 *   M1 → S1 (Directivo)     - Alta tarea, baja relación
 *   M2 → S2 (Persuasivo)    - Alta tarea, alta relación
 *   M3 → S3 (Participativo) - Baja tarea, alta relación
 *   M4 → S4 (Delegativo)    - Baja tarea, baja relación
 *
 * Ciclo de Kolb:
 *  - Experiencia concreta: presentación del escenario
 *  - Observación reflexiva: retroalimentación de la elección
 *  - Conceptualización abstracta: explicación teórica
 *  - Experimentación activa: oportunidad de reintentar
 */
@Injectable()
export class LeadershipService {
  // ─── Optimal style mapping ─────────────────────────────────────
  private readonly OPTIMAL_STYLE: Record<MaturityLevel, LeadershipStyle> = {
    M1: 'S1',
    M2: 'S2',
    M3: 'S3',
    M4: 'S4',
  };

  // ─── Effectiveness matrix (selected × maturity) ────────────────
  // Score percentage when choosing style Si for maturity Mj
  private readonly EFFECTIVENESS: Record<LeadershipStyle, Record<MaturityLevel, number>> = {
    S1: { M1: 100, M2: 60, M3: 30, M4: 10 },
    S2: { M1: 65, M2: 100, M3: 55, M4: 25 },
    S3: { M1: 25, M2: 55, M3: 100, M4: 60 },
    S4: { M1: 10, M2: 30, M3: 65, M4: 100 },
  };

  // ─── Style labels ─────────────────────────────────────────────
  private readonly STYLE_LABELS: Record<LeadershipStyle, string> = {
    S1: 'Directivo (Telling)',
    S2: 'Persuasivo (Selling)',
    S3: 'Participativo (Participating)',
    S4: 'Delegativo (Delegating)',
  };

  // ─── Maturity descriptions ────────────────────────────────────
  private readonly MATURITY_DESC: Record<MaturityLevel, { technical: string; emotional: string; summary: string }> = {
    M1: {
      technical: 'Baja competencia técnica: el equipo carece de habilidades y conocimientos necesarios.',
      emotional: 'Alto compromiso inicial: motivados pero sin experiencia.',
      summary: 'Requiere instrucciones claras y supervisión cercana. El líder debe definir qué, cómo, cuándo y dónde.',
    },
    M2: {
      technical: 'Alguna competencia: el equipo ha desarrollado habilidades básicas pero aún necesita guía.',
      emotional: 'Bajo compromiso: la motivación ha disminuido al enfrentar la complejidad real.',
      summary: 'Necesita tanto dirección técnica como apoyo emocional. El líder debe explicar el "por qué" de las decisiones.',
    },
    M3: {
      technical: 'Alta competencia: el equipo tiene las habilidades técnicas necesarias.',
      emotional: 'Compromiso variable: capaces pero inseguros o desmotivados en ciertos momentos.',
      summary: 'Necesita participación en la toma de decisiones para aumentar la confianza. El líder facilita y apoya.',
    },
    M4: {
      technical: 'Alta competencia: dominio técnico completo del área.',
      emotional: 'Alto compromiso: motivados, seguros y autónomos.',
      summary: 'Equipo autosuficiente. El líder delega responsabilidad y autoridad con supervisión mínima.',
    },
  };

  // ─── Task / Relationship behavior descriptions ─────────────────
  private readonly BEHAVIOR_ANALYSIS: Record<LeadershipStyle, { task: string; relationship: string }> = {
    S1: {
      task: 'Comportamiento de tarea ALTO: define roles, establece metas específicas, supervisa de cerca, da instrucciones paso a paso.',
      relationship: 'Comportamiento de relación BAJO: comunicación unidireccional, enfocado en la estructura y el control.',
    },
    S2: {
      task: 'Comportamiento de tarea ALTO: continúa proporcionando dirección y estructura, pero con explicaciones.',
      relationship: 'Comportamiento de relación ALTO: comunicación bidireccional, solicita sugerencias, explica el razonamiento de las decisiones.',
    },
    S3: {
      task: 'Comportamiento de tarea BAJO: el líder reduce la dirección técnica, comparte la toma de decisiones.',
      relationship: 'Comportamiento de relación ALTO: escucha activa, facilita la resolución de problemas, promueve la autonomía del equipo.',
    },
    S4: {
      task: 'Comportamiento de tarea BAJO: el líder permite que el equipo defina sus propios procesos y métodos.',
      relationship: 'Comportamiento de relación BAJO: supervisión mínima, el equipo se autogestiona y reporta resultados.',
    },
  };

  /**
   * Evalúa la decisión del usuario dado un escenario con madurez específica.
   * Calcula la "Efectividad del Líder" usando la matriz de Hersey-Blanchard.
   */
  evaluate(
    scenarioFeedback: Record<string, { score: number; type: string; title: string; text: string }>,
    selectedOption: string,
    theory: string,
    maturityLevel?: string,
  ): LeadershipEvaluationResult {
    const fb = scenarioFeedback[selectedOption];
    if (!fb) {
      return {
        score: 0,
        effectiveness: 0,
        selectedStyle: 'S1',
        optimalStyle: 'S1',
        maturityLevel: 'M1',
        isOptimal: false,
        isAcceptable: false,
        styleLabel: 'Desconocido',
        optimalStyleLabel: this.STYLE_LABELS['S1'],
        maturityDescription: '',
        feedback: {
          title: 'Opción no válida',
          text: 'La opción seleccionada no existe en este escenario.',
          type: 'error',
        },
        theory,
        kolbPhase: 'experiencia',
        taskBehaviorAnalysis: '',
        relationshipBehaviorAnalysis: '',
      };
    }

    // Derive style from option and maturity from scenario
    const selectedStyle = this.inferStyle(selectedOption, scenarioFeedback);
    const maturity = this.normalizeMaturity(maturityLevel);
    const optimalStyle = this.OPTIMAL_STYLE[maturity];

    // Calculate effectiveness from the matrix
    const effectiveness = this.EFFECTIVENESS[selectedStyle]?.[maturity] ?? fb.score;
    const isOptimal = selectedStyle === optimalStyle;
    const isAcceptable = effectiveness >= 55;

    // Build detailed feedback
    const detailedFeedback = this.buildFeedback(
      selectedStyle,
      optimalStyle,
      maturity,
      effectiveness,
      isOptimal,
      fb,
    );

    // Map effectiveness to Kolb cycle phase
    const kolbPhase = this.mapKolbPhase(effectiveness);

    const behavior = this.BEHAVIOR_ANALYSIS[selectedStyle];

    return {
      score: fb.score,
      effectiveness,
      selectedStyle,
      optimalStyle,
      maturityLevel: maturity,
      isOptimal,
      isAcceptable,
      styleLabel: this.STYLE_LABELS[selectedStyle],
      optimalStyleLabel: this.STYLE_LABELS[optimalStyle],
      maturityDescription: this.MATURITY_DESC[maturity].summary,
      feedback: detailedFeedback,
      theory,
      kolbPhase,
      taskBehaviorAnalysis: behavior.task,
      relationshipBehaviorAnalysis: behavior.relationship,
    };
  }

  /**
   * Evalúa la efectividad dado directamente el estilo y la madurez
   * (sin necesidad de escenario precargado).
   */
  evaluateDirect(
    selectedStyle: LeadershipStyle,
    maturityLevel: MaturityLevel,
  ): {
    effectiveness: number;
    isOptimal: boolean;
    optimalStyle: LeadershipStyle;
    maturityAnalysis: typeof this.MATURITY_DESC[MaturityLevel];
    behaviorAnalysis: typeof this.BEHAVIOR_ANALYSIS[LeadershipStyle];
    feedback: string;
  } {
    const optimalStyle = this.OPTIMAL_STYLE[maturityLevel];
    const effectiveness = this.EFFECTIVENESS[selectedStyle][maturityLevel];
    const isOptimal = selectedStyle === optimalStyle;

    let feedback: string;
    if (isOptimal) {
      feedback = `Excelente elección. El estilo ${this.STYLE_LABELS[selectedStyle]} es el óptimo para un equipo con madurez ${maturityLevel}. ${this.MATURITY_DESC[maturityLevel].summary}`;
    } else if (effectiveness >= 55) {
      feedback = `Elección aceptable (${effectiveness}% de efectividad). El estilo ${this.STYLE_LABELS[selectedStyle]} puede funcionar con madurez ${maturityLevel}, pero el óptimo sería ${this.STYLE_LABELS[optimalStyle]}. Razón: ${this.MATURITY_DESC[maturityLevel].summary}`;
    } else {
      feedback = `Estilo inadecuado (${effectiveness}% de efectividad). Para madurez ${maturityLevel}, el equipo ${this.MATURITY_DESC[maturityLevel].technical.toLowerCase()} y ${this.MATURITY_DESC[maturityLevel].emotional.toLowerCase()}. El estilo recomendado es ${this.STYLE_LABELS[optimalStyle]}.`;
    }

    return {
      effectiveness,
      isOptimal,
      optimalStyle,
      maturityAnalysis: this.MATURITY_DESC[maturityLevel],
      behaviorAnalysis: this.BEHAVIOR_ANALYSIS[selectedStyle],
      feedback,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────

  /**
   * Infer the style from the selected option.
   * Options typically embed the style (e.g., "S1", "S2") or we map by score.
   */
  private inferStyle(
    selectedOption: string,
    feedback: Record<string, { score: number }>,
  ): LeadershipStyle {
    const upper = selectedOption.toUpperCase();
    if (['S1', 'S2', 'S3', 'S4'].includes(upper)) {
      return upper as LeadershipStyle;
    }

    // Map option letters to styles based on scenario convention: A→S1, B→S2, C→S3, D→S4
    const optionMap: Record<string, LeadershipStyle> = { A: 'S1', B: 'S2', C: 'S3', D: 'S4' };
    if (optionMap[upper]) return optionMap[upper];

    // Fallback: infer from score — highest score option = optimal style
    const entries = Object.entries(feedback).sort(([, a], [, b]) => b.score - a.score);
    const idx = entries.findIndex(([key]) => key === selectedOption);
    const styles: LeadershipStyle[] = ['S1', 'S2', 'S3', 'S4'];
    return styles[Math.min(idx, 3)] ?? 'S1';
  }

  private normalizeMaturity(raw?: string): MaturityLevel {
    if (!raw) return 'M2'; // Default middle maturity
    const upper = raw.toUpperCase().trim();
    if (['M1', 'M2', 'M3', 'M4'].includes(upper)) return upper as MaturityLevel;
    return 'M2';
  }

  private buildFeedback(
    selected: LeadershipStyle,
    optimal: LeadershipStyle,
    maturity: MaturityLevel,
    effectiveness: number,
    isOptimal: boolean,
    scenarioFb: { score: number; type: string; title: string; text: string },
  ): { title: string; text: string; type: 'excellent' | 'good' | 'warning' | 'error' } {
    if (isOptimal) {
      return {
        title: `¡Decisión óptima! Estilo ${this.STYLE_LABELS[selected]}`,
        text: `${scenarioFb.text}\n\nEl estilo ${this.STYLE_LABELS[selected]} es el más efectivo para un equipo con madurez ${maturity}. ${this.MATURITY_DESC[maturity].technical} ${this.MATURITY_DESC[maturity].emotional} Tu elección demuestra comprensión del modelo de Liderazgo Situacional.`,
        type: 'excellent',
      };
    }

    if (effectiveness >= 55) {
      return {
        title: `Elección aceptable: ${this.STYLE_LABELS[selected]}`,
        text: `${scenarioFb.text}\n\nTu elección tiene un ${effectiveness}% de efectividad. Aunque funcional, el estilo óptimo para madurez ${maturity} sería ${this.STYLE_LABELS[optimal]}. Recuerda: ${this.MATURITY_DESC[maturity].summary}`,
        type: 'good',
      };
    }

    if (effectiveness >= 25) {
      return {
        title: `Estilo poco efectivo: ${this.STYLE_LABELS[selected]}`,
        text: `${scenarioFb.text}\n\nCon solo ${effectiveness}% de efectividad, este estilo no se alinea bien con la madurez ${maturity} del equipo. ${this.MATURITY_DESC[maturity].technical} ${this.MATURITY_DESC[maturity].emotional} Considera usar el estilo ${this.STYLE_LABELS[optimal]}: ${this.MATURITY_DESC[maturity].summary}`,
        type: 'warning',
      };
    }

    return {
      title: `Estilo inadecuado: ${this.STYLE_LABELS[selected]}`,
      text: `${scenarioFb.text}\n\nEfectividad de solo ${effectiveness}%. Este estilo es opuesto a lo que el equipo necesita. Para madurez ${maturity}: ${this.MATURITY_DESC[maturity].technical} ${this.MATURITY_DESC[maturity].emotional} El estilo correcto es ${this.STYLE_LABELS[optimal]}: ${this.MATURITY_DESC[maturity].summary}`,
      type: 'error',
    };
  }

  private mapKolbPhase(effectiveness: number): string {
    if (effectiveness >= 85) return 'experimentación';
    if (effectiveness >= 60) return 'conceptualización';
    if (effectiveness >= 35) return 'observación';
    return 'experiencia';
  }
}
