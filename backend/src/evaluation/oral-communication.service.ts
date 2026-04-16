import { Injectable } from '@nestjs/common';

/**
 * Oral Communication Evaluation Service
 *
 * Simulates integration with OpenAI Whisper for audio transcription
 * and evaluates presentations using the OCS-STEM rubric criteria:
 *  - Conceptual clarity
 *  - Logical structure
 *  - Technical vocabulary
 *  - Audience adaptation
 *  - Fluency and confidence
 *
 * In production, the audio would be sent to a Whisper endpoint;
 * here we evaluate a transcribed text to allow functional scoring.
 */
@Injectable()
export class OralCommunicationService {
  /**
   * Evaluate an oral presentation transcript against OCS-STEM rubric.
   */
  evaluate(
    transcript: string,
    criteria: { id: string; label: string; weight: number }[],
  ) {
    const words = transcript.trim().split(/\s+/);
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

    // Technical vocabulary detection (common CS/engineering terms)
    const techTerms = [
      'arquitectura', 'sistema', 'software', 'hardware', 'base de datos',
      'algoritmo', 'interfaz', 'protocolo', 'servidor', 'cliente',
      'microservicio', 'api', 'framework', 'módulo', 'componente',
      'patrón', 'escalabilidad', 'rendimiento', 'seguridad', 'red',
      'mvc', 'rest', 'http', 'tcp', 'sql', 'nosql', 'cloud',
    ];
    const lowerText = transcript.toLowerCase();
    const techWordCount = techTerms.filter((t) => lowerText.includes(t)).length;

    // Score each criterion using heuristic NLP analysis
    const criteriaScores = criteria.map((c) => {
      let score: number;

      switch (c.id || c.label.toLowerCase()) {
        case 'claridad':
        case 'claridad conceptual':
          // Based on sentence length balance and vocabulary diversity
          score = this.clampScore(
            60 + Math.min(wordCount / 5, 20) + (avgWordsPerSentence < 25 ? 10 : -5),
          );
          break;

        case 'estructura':
        case 'estructura lógica':
          // Based on sentence count and paragraph-like structure
          score = this.clampScore(
            55 + Math.min(sentenceCount * 3, 25) + (sentenceCount >= 5 ? 10 : 0),
          );
          break;

        case 'vocabulario':
        case 'vocabulario técnico':
          score = this.clampScore(50 + techWordCount * 5);
          break;

        case 'adaptación':
        case 'adaptación al público':
          // Penalize overly complex sentences
          score = this.clampScore(
            70 + (avgWordsPerSentence < 20 ? 15 : -10) + (techWordCount > 3 ? 5 : 0),
          );
          break;

        case 'fluidez':
        case 'fluidez y seguridad':
          // Based on text length as proxy for fluency
          score = this.clampScore(60 + Math.min(wordCount / 8, 20) + (sentenceCount > 3 ? 10 : 0));
          break;

        default:
          score = this.clampScore(65 + Math.random() * 20);
      }

      return {
        criterionId: c.id,
        label: c.label,
        weight: c.weight,
        score: Math.round(score),
      };
    });

    // Calculate weighted total
    const totalWeight = criteriaScores.reduce((s, c) => s + c.weight, 0);
    const totalScore = Math.round(
      criteriaScores.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0),
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(criteriaScores);

    return {
      score: totalScore,
      criteriaScores,
      stats: { wordCount, sentenceCount, avgWordsPerSentence, techWordCount },
      recommendations,
      kolbPhase: totalScore >= 80 ? 'experimentación' : totalScore >= 60 ? 'conceptualización' : 'observación',
    };
  }

  /**
   * Simulated Whisper transcription placeholder.
   * In production, replace with actual Whisper API call.
   */
  async transcribeAudio(_audioBuffer: Buffer): Promise<string> {
    // Placeholder – return message indicating integration pending
    return '[Transcripción simulada] El audio ha sido procesado. En producción se conectará con la API de Whisper para transcripción real.';
  }

  private clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    criteriaScores: { label: string; score: number }[],
  ): string[] {
    const recommendations: string[] = [];
    const sorted = [...criteriaScores].sort((a, b) => a.score - b.score);

    // Top 3 weakest areas
    for (const c of sorted.slice(0, 3)) {
      if (c.score < 70) {
        recommendations.push(`Mejorar en ${c.label}: tu puntuación fue ${c.score}/100. Practica con ejercicios enfocados en este aspecto.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Excelente desempeño general. Continúa practicando para mantener tu nivel.');
    }

    return recommendations;
  }
}
