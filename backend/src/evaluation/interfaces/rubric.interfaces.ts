// ─── OCS-STEM Rubric (Oral Communication in STEM) ─────────────────

/** Individual criterion within the OCS-STEM rubric */
export interface OcsStemCriterion {
  id: string;
  label: string;
  weight: number;
  description: string;
  /** Performance levels mapped to score ranges */
  levels: {
    excellent: { min: 85; description: string };
    proficient: { min: 70; description: string };
    developing: { min: 50; description: string };
    beginning: { min: 0; description: string };
  };
}

/** Score for a single criterion after evaluation */
export interface OcsStemCriterionScore {
  criterionId: string;
  label: string;
  weight: number;
  score: number;
  level: 'excellent' | 'proficient' | 'developing' | 'beginning';
  feedback: string;
}

/** Complete OCS-STEM evaluation result */
export interface OcsStemEvaluationResult {
  score: number;
  criteriaScores: OcsStemCriterionScore[];
  stats: OralTextStats;
  recommendations: string[];
  strengths: string[];
  structureAnalysis: StructureAnalysis;
  technicalVocabularyAnalysis: TechnicalVocabularyAnalysis;
  kolbPhase: string;
  nlpDetails?: {
    wordCount: number;
    sentenceCount: number;
    techTermsFound: string[];
    techTermCount: number;
    guiraudIndex: number;
    fernandezHuerta: number;
    complexityLevel: string;
    connectorsCount: number;
    uniqueWordRatio: number;
    hasIntroduction: boolean;
    hasConclusion: boolean;
    lengthPenaltyApplied: boolean;
  };
}

export interface OralTextStats {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  techTermCount: number;
  uniqueWordRatio: number;
  connectorsCount: number;
}

export interface StructureAnalysis {
  hasIntroduction: boolean;
  hasDevelopment: boolean;
  hasConclusion: boolean;
  structureScore: number;
  feedback: string;
}

export interface TechnicalVocabularyAnalysis {
  termsFound: string[];
  density: number;
  score: number;
  feedback: string;
}

// ─── TWR Rubric (Technical Writing Rubric) ─────────────────────────

/** Individual criterion within the TWR rubric */
export interface TwrCriterion {
  id: string;
  label: string;
  weight: number;
  description: string;
  levels: {
    excellent: { min: 85; description: string };
    proficient: { min: 70; description: string };
    developing: { min: 50; description: string };
    beginning: { min: 0; description: string };
  };
}

/** Score for a single TWR criterion */
export interface TwrCriterionScore {
  criterionId: string;
  label: string;
  weight: number;
  score: number;
  level: 'excellent' | 'proficient' | 'developing' | 'beginning';
  feedback: string;
}

/** Complete TWR evaluation result */
export interface TwrEvaluationResult {
  score: number;
  criteriaScores: TwrCriterionScore[];
  stats: WrittenTextStats;
  synthesisAnalysis: SynthesisAnalysis;
  cohesionAnalysis: CohesionAnalysis;
  issues: TextIssue[];
  recommendations: string[];
  editingSuggestions: string[];
  kolbPhase: string;
  nlpDetails?: TwrNlpDetails;
}

export interface TwrNlpDetails {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  techTermsFound: string[];
  techTermCount: number;
  connectorsUsed: string[];
  connectorsCount: number;
  guiraudIndex: number;
  fernandezHuerta: number;
  complexityLevel: string;
  uniqueWordRatio: number;
  lexicalDensity: number;
  redundancyIndex: number;
  conceptDensity: number;
  lengthPenaltyApplied: boolean;
}

export interface WrittenTextStats {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  paragraphCount: number;
  techTermCount: number;
  uniqueWordRatio: number;
  connectorsCount: number;
  lexicalDensity: number;
}

export interface SynthesisAnalysis {
  /** Ratio of key concepts retained vs. total word count */
  conceptDensity: number;
  /** Whether text is within expected limits */
  withinLimits: boolean;
  /** Number of key concepts identified */
  keyConceptsFound: number;
  /** Redundancy index (lower = better) */
  redundancyIndex: number;
  score: number;
  feedback: string;
}

export interface CohesionAnalysis {
  /** Presence of logical connectors */
  connectorsUsed: string[];
  /** Paragraph transition quality */
  transitionScore: number;
  /** Sentence-to-sentence flow */
  flowScore: number;
  /** Multi-level structure: planning, writing, revision */
  structureQuality: number;
  score: number;
  feedback: string;
}

export interface TextIssue {
  type: 'warning' | 'success' | 'info' | 'error';
  category: 'synthesis' | 'cohesion' | 'grammar' | 'structure' | 'vocabulary' | 'length';
  message: string;
}

// ─── Leadership Evaluation (Hersey & Blanchard) ────────────────────

/** Maturity levels of followers */
export type MaturityLevel = 'M1' | 'M2' | 'M3' | 'M4';

/** Leadership styles */
export type LeadershipStyle = 'S1' | 'S2' | 'S3' | 'S4';

export interface LeadershipEvaluationResult {
  score: number;
  effectiveness: number;
  selectedStyle: LeadershipStyle;
  optimalStyle: LeadershipStyle;
  maturityLevel: MaturityLevel;
  isOptimal: boolean;
  isAcceptable: boolean;
  styleLabel: string;
  optimalStyleLabel: string;
  maturityDescription: string;
  feedback: {
    title: string;
    text: string;
    type: 'excellent' | 'good' | 'warning' | 'error';
  };
  theory: string;
  kolbPhase: string;
  taskBehaviorAnalysis: string;
  relationshipBehaviorAnalysis: string;
}

// ─── Gamification (Bandura Self-Efficacy Theory) ───────────────────

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'mastery' | 'persistence' | 'social' | 'exploration';
  condition: BadgeCondition;
}

export interface BadgeCondition {
  type: 'score_threshold' | 'streak' | 'module_complete' | 'improvement' | 'first_activity' | 'total_xp' | 'perfect_score';
  /** Minimum value to trigger */
  threshold?: number;
  /** Module type or ID filter */
  moduleFilter?: string;
}

export interface XpEvent {
  userId: string;
  source: 'scenario' | 'oral' | 'written' | 'badge' | 'streak' | 'improvement';
  amount: number;
  description: string;
  timestamp: Date;
}

export interface MotivationalMessage {
  type: 'mastery_experience' | 'vicarious_experience' | 'verbal_persuasion' | 'physiological_state';
  message: string;
  context: string;
}

export interface GamificationSnapshot {
  userId: string;
  totalXp: number;
  level: number;
  levelName: string;
  streak: number;
  badges: { badge: BadgeDefinition; earnedAt: Date }[];
  recentXpEvents: XpEvent[];
  motivationalMessage: MotivationalMessage | null;
  nextMilestone: { description: string; xpNeeded: number; progress: number };
}
