import { Injectable } from '@nestjs/common';

/**
 * Technical Writing Evaluation Service
 *
 * Simulates integration with spaCy for NLP analysis.
 * Evaluates writing using the TWR (Technical Writing Rubric):
 *  - Clarity and comprehension
 *  - Effective synthesis
 *  - Audience adaptation
 *  - Structure and coherence
 *
 * Kolb cycle: each submission provides detailed feedback
 * enabling observation → conceptualisation → experimentation.
 */
@Injectable()
export class WrittenCommunicationService {
  evaluate(
    text: string,
    criteria: { id: string; label: string; weight: number }[],
    wordLimit?: { min: number; max: number },
  ) {
    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

    // Technical vocabulary analysis
    const techTerms = [
      'arquitectura', 'microservicio', 'api', 'endpoint', 'base de datos',
      'servidor', 'escalabilidad', 'contenedor', 'docker', 'kubernetes',
      'latencia', 'throughput', 'sql', 'rest', 'http', 'framework',
      'patrón', 'módulo', 'componente', 'protocolo', 'seguridad',
      'inyección', 'vulnerabilidad', 'autenticación', 'cifrado', 'firewall',
      'incidente', 'sistema', 'red', 'log', 'monitoreo',
    ];
    const lowerText = text.toLowerCase();
    const techWordCount = techTerms.filter((t) => lowerText.includes(t)).length;

    // Find issues
    const issues: { type: 'warning' | 'success' | 'info'; message: string }[] = [];

    // Word limit validation
    if (wordLimit) {
      if (wordCount < wordLimit.min) {
        issues.push({ type: 'warning', message: `El texto tiene ${wordCount} palabras, por debajo del mínimo de ${wordLimit.min}.` });
      } else if (wordCount > wordLimit.max) {
        issues.push({ type: 'warning', message: `El texto tiene ${wordCount} palabras, excede el máximo de ${wordLimit.max}.` });
      } else {
        issues.push({ type: 'success', message: `Longitud adecuada: ${wordCount} palabras dentro del rango permitido.` });
      }
    }

    // Sentence complexity
    if (avgWordsPerSentence > 30) {
      issues.push({ type: 'warning', message: 'Oraciones demasiado largas. Considera fragmentarlas para mayor claridad.' });
    } else if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) {
      issues.push({ type: 'success', message: 'Buena longitud promedio de oraciones para escritura técnica.' });
    }

    // Technical vocabulary
    if (techWordCount >= 5) {
      issues.push({ type: 'success', message: 'Buen uso de vocabulario técnico especializado.' });
    } else if (techWordCount < 2) {
      issues.push({ type: 'info', message: 'Considera incorporar más terminología técnica específica.' });
    }

    // Structure
    if (paragraphs.length >= 2) {
      issues.push({ type: 'success', message: 'Texto bien estructurado en párrafos.' });
    } else {
      issues.push({ type: 'info', message: 'Considera dividir el texto en párrafos para mejorar la legibilidad.' });
    }

    // Score each criterion
    const criteriaScores = criteria.map((c) => {
      let score: number;

      const cId = (c.id || c.label).toLowerCase();

      if (cId.includes('claridad') || cId.includes('comprensión')) {
        score = this.clamp(
          55 + (avgWordsPerSentence <= 25 ? 20 : 5) + Math.min(sentenceCount * 2, 15) + (techWordCount > 2 ? 5 : 0),
        );
      } else if (cId.includes('síntesis') || cId.includes('sintesis')) {
        const withinLimits = wordLimit
          ? wordCount >= wordLimit.min && wordCount <= wordLimit.max
          : wordCount <= 300;
        score = this.clamp(
          50 + (withinLimits ? 25 : 5) + Math.min(paragraphs.length * 5, 15),
        );
      } else if (cId.includes('adaptación') || cId.includes('público') || cId.includes('publico')) {
        score = this.clamp(
          60 + (avgWordsPerSentence < 22 ? 15 : 0) + (techWordCount >= 3 ? 10 : 0),
        );
      } else if (cId.includes('estructura') || cId.includes('coherencia')) {
        score = this.clamp(
          55 + (paragraphs.length >= 2 ? 20 : 5) + Math.min(sentenceCount * 2, 15),
        );
      } else {
        score = this.clamp(60 + Math.min(wordCount / 10, 20));
      }

      return {
        criterionId: c.id,
        label: c.label,
        weight: c.weight,
        score: Math.round(score),
      };
    });

    // Weighted total
    const totalWeight = criteriaScores.reduce((s, c) => s + c.weight, 0);
    const totalScore = Math.round(
      criteriaScores.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0),
    );

    // Recommendations
    const recommendations = this.generateRecommendations(criteriaScores, issues);

    return {
      score: totalScore,
      criteriaScores,
      stats: { wordCount, sentenceCount, avgWordsPerSentence, techWordCount, paragraphCount: paragraphs.length },
      issues,
      recommendations,
      kolbPhase: totalScore >= 80 ? 'experimentación' : totalScore >= 60 ? 'conceptualización' : 'observación',
    };
  }

  private clamp(val: number): number {
    return Math.max(0, Math.min(100, val));
  }

  private generateRecommendations(
    criteriaScores: { label: string; score: number }[],
    issues: { type: string; message: string }[],
  ): string[] {
    const recs: string[] = [];
    const weakest = [...criteriaScores].sort((a, b) => a.score - b.score);

    for (const c of weakest.slice(0, 2)) {
      if (c.score < 75) {
        recs.push(`Trabaja en "${c.label}": puntuación actual ${c.score}/100.`);
      }
    }

    const warnings = issues.filter((i) => i.type === 'warning');
    for (const w of warnings) {
      recs.push(w.message);
    }

    if (recs.length === 0) {
      recs.push('Excelente trabajo. Sigue practicando para consolidar tus habilidades de escritura técnica.');
    }

    return recs;
  }
}
