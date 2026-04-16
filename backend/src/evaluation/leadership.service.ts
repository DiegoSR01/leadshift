import { Injectable } from '@nestjs/common';

/**
 * Leadership Evaluation Engine based on Hersey & Blanchard's
 * Situational Leadership Model.
 *
 * Evaluates the student's ability to select the correct leadership
 * style (S1–S4) based on follower maturity (M1–M4).
 *
 * Kolb cycle integration:
 *  - Experience: scenario presentation
 *  - Observation: feedback on choice
 *  - Conceptualization: theory explanation
 *  - Experimentation: reattempt opportunity
 */
@Injectable()
export class LeadershipService {
  /**
   * Given a scenario's feedback map and the user's selected option,
   * return the evaluation result.
   */
  evaluate(
    scenarioFeedback: Record<string, { score: number; type: string; title: string; text: string }>,
    selectedOption: string,
    theory: string,
  ) {
    const fb = scenarioFeedback[selectedOption];
    if (!fb) {
      return {
        score: 0,
        type: 'error',
        title: 'Opción no válida',
        text: 'La opción seleccionada no existe.',
        theory,
        kolbPhase: 'experiencia',
      };
    }

    // Map score ranges to Kolb cycle phase recommendations
    let kolbPhase: string;
    if (fb.score >= 80) {
      kolbPhase = 'experimentación'; // Ready to apply more complex scenarios
    } else if (fb.score >= 60) {
      kolbPhase = 'conceptualización'; // Needs deeper theory
    } else if (fb.score >= 40) {
      kolbPhase = 'observación'; // Needs to reflect
    } else {
      kolbPhase = 'experiencia'; // Needs to re-experience
    }

    return {
      score: fb.score,
      type: fb.type,
      title: fb.title,
      text: fb.text,
      theory,
      kolbPhase,
      maturityAnalysis: this.analyzeMaturity(fb.score),
    };
  }

  /**
   * Determine follower maturity label based on accumulated performance.
   */
  private analyzeMaturity(score: number): { level: string; description: string } {
    if (score >= 85) {
      return {
        level: 'M4',
        description: 'Alta competencia y alto compromiso. Estilo recomendado: Delegativo (S4).',
      };
    }
    if (score >= 65) {
      return {
        level: 'M3',
        description: 'Alta competencia, compromiso variable. Estilo recomendado: Participativo (S3).',
      };
    }
    if (score >= 40) {
      return {
        level: 'M2',
        description: 'Alguna competencia, bajo compromiso. Estilo recomendado: Persuasivo (S2).',
      };
    }
    return {
      level: 'M1',
      description: 'Baja competencia, alto compromiso inicial. Estilo recomendado: Directivo (S1).',
    };
  }
}
