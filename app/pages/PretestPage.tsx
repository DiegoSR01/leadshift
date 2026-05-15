import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import {
  ClipboardList, ChevronRight, ChevronLeft, CheckCircle,
  Users, Mic, PenTool, Handshake, Layers, Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Assessment instrument ─────────────────────────────────────────────────

interface Question {
  id: string;
  skill: SkillKey;
  section: string;
  text: string;
}

type SkillKey = 'liderazgo' | 'comOral' | 'escritura' | 'equipos' | 'sintesis' | 'resolucion';

const SKILL_LABELS: Record<SkillKey, string> = {
  liderazgo: 'Liderazgo',
  comOral: 'Com. Oral',
  escritura: 'Escritura',
  equipos: 'Trabajo en equipo',
  sintesis: 'Síntesis',
  resolucion: 'Resolución',
};

const SKILL_ICONS: Record<SkillKey, any> = {
  liderazgo: Users,
  comOral: Mic,
  escritura: PenTool,
  equipos: Handshake,
  sintesis: Layers,
  resolucion: Lightbulb,
};

const SKILL_COLORS: Record<SkillKey, string> = {
  liderazgo: 'from-blue-500 to-blue-700',
  comOral: 'from-violet-500 to-violet-700',
  escritura: 'from-cyan-500 to-cyan-700',
  equipos: 'from-emerald-500 to-emerald-700',
  sintesis: 'from-amber-500 to-amber-700',
  resolucion: 'from-rose-500 to-rose-700',
};

const SKILL_MAX: Record<SkillKey, number> = {
  liderazgo: 25,
  comOral: 25,
  escritura: 25,
  equipos: 15,
  sintesis: 15,
  resolucion: 15,
};

const QUESTIONS: Question[] = [
  // Liderazgo Situacional
  { id: 'l1', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Cuando un integrante de mi equipo tiene dificultades con una tarea, adapto el nivel de apoyo que le brindo según su necesidad específica.' },
  { id: 'l2', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Delego responsabilidades considerando las capacidades y el nivel de madurez de cada persona.' },
  { id: 'l3', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Comunico las expectativas y objetivos del equipo con claridad antes de iniciar cualquier proyecto.' },
  { id: 'l4', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Me responsabilizo de los resultados del equipo, tanto en los éxitos como en los errores.' },
  { id: 'l5', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Ajusto mi estilo de dirección (directivo, de apoyo, delegador) según la experiencia y motivación de cada integrante.' },
  // Comunicación Oral
  { id: 'o1', skill: 'comOral', section: 'Comunicación Oral', text: 'Organizo mis ideas antes de hablar para comunicarme con claridad y coherencia.' },
  { id: 'o2', skill: 'comOral', section: 'Comunicación Oral', text: 'Mantengo contacto visual y empleo un lenguaje corporal apropiado al dirigirme a una audiencia.' },
  { id: 'o3', skill: 'comOral', section: 'Comunicación Oral', text: 'Adapto mi vocabulario y tono según el tipo de audiencia (técnica, general, formal, informal).' },
  { id: 'o4', skill: 'comOral', section: 'Comunicación Oral', text: 'Escucho activamente a mis interlocutores y respondo de manera pertinente a sus comentarios.' },
  { id: 'o5', skill: 'comOral', section: 'Comunicación Oral', text: 'Resumo los puntos clave de una conversación o presentación de forma efectiva.' },
  // Comunicación Escrita
  { id: 'e1', skill: 'escritura', section: 'Comunicación Escrita', text: 'Organizo mis documentos escritos con una estructura clara (introducción, desarrollo, conclusión).' },
  { id: 'e2', skill: 'escritura', section: 'Comunicación Escrita', text: 'Reviso la gramática y ortografía de mis escritos antes de compartirlos.' },
  { id: 'e3', skill: 'escritura', section: 'Comunicación Escrita', text: 'Adapto mi estilo de escritura al contexto y propósito del documento.' },
  { id: 'e4', skill: 'escritura', section: 'Comunicación Escrita', text: 'Sintetizo información compleja proveniente de múltiples fuentes en resúmenes coherentes.' },
  { id: 'e5', skill: 'escritura', section: 'Comunicación Escrita', text: 'Mis textos logran comunicar el mensaje con claridad, de forma que el lector los entiende sin ambigüedad.' },
  // Trabajo en equipo
  { id: 't1', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Contribuyo activamente al logro de los objetivos del grupo.' },
  { id: 't2', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Valoro y considero las opiniones y aportaciones de mis compañeros.' },
  { id: 't3', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Gestiono los conflictos dentro del equipo de forma constructiva.' },
  // Síntesis
  { id: 's1', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Identifico las ideas principales de textos o exposiciones complejas con facilidad.' },
  { id: 's2', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Soy capaz de resumir información de varias fuentes en un solo documento coherente.' },
  { id: 's3', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Presento información de forma concisa sin perder los aspectos esenciales.' },
  // Resolución de problemas
  { id: 'r1', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Analizo las causas de un problema antes de proponer una solución.' },
  { id: 'r2', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Propongo soluciones creativas e innovadoras ante situaciones de dificultad.' },
  { id: 'r3', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Evalúo las posibles consecuencias de mis decisiones antes de implementarlas.' },
];

const SCALE = [
  { value: 1, label: 'Nunca' },
  { value: 2, label: 'Casi nunca' },
  { value: 3, label: 'A veces' },
  { value: 4, label: 'Casi siempre' },
  { value: 5, label: 'Siempre' },
];

// Group questions into sections (one section per skill)
const SECTIONS = Array.from(
  new Map(QUESTIONS.map((q) => [q.skill, q.section])).entries(),
).map(([skill, section]) => ({
  skill: skill as SkillKey,
  section,
  questions: QUESTIONS.filter((q) => q.skill === skill),
}));

// ─── Score calculation ─────────────────────────────────────────────────────

function computeScores(answers: Record<string, number>): Record<SkillKey, number> {
  const skills = Object.keys(SKILL_LABELS) as SkillKey[];
  const result: Partial<Record<SkillKey, number>> = {};
  for (const skill of skills) {
    const qs = QUESTIONS.filter((q) => q.skill === skill);
    const sum = qs.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0);
    const max = SKILL_MAX[skill];
    result[skill] = Math.round((sum / max) * 100);
  }
  return result as Record<SkillKey, number>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function PretestPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<Record<SkillKey, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if already completed
  useEffect(() => {
    api.assessments.status().then((s) => {
      if (s.pretestCompleted) navigate('/app', { replace: true });
    }).catch(() => {});
  }, [navigate]);

  const section = SECTIONS[currentSection];
  const totalSections = SECTIONS.length;
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const sectionAnswered = section.questions.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) setCurrentSection((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const computed = computeScores(answers);
      await api.assessments.submit('pretest', computed);
      setScores(computed);
      setSubmitted(true);
      await refreshUser();
    } catch (e: any) {
      setError(e.message || 'Error al enviar el pretest');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Results screen ──────────────────────────────────────────────────────
  if (submitted && scores) {
    const radarData = (Object.keys(SKILL_LABELS) as SkillKey[]).map((skill) => ({
      skill: SKILL_LABELS[skill],
      score: scores[skill],
    }));
    const avgScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length,
    );

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-700 px-8 py-8 text-white text-center">
            <CheckCircle className="w-14 h-14 mx-auto mb-3 text-emerald-300" />
            <h1 className="text-2xl font-extrabold mb-1">¡Diagnóstico Completado!</h1>
            <p className="text-blue-100 text-sm">Tu Perfil de Habilidades Inicial ha sido guardado</p>
          </div>

          <div className="px-8 py-6">
            {/* Radar chart */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Tu Perfil de Habilidades Inicial</h2>
              <p className="text-slate-500 text-sm mb-4">
                Puntuación promedio: <span className="font-bold text-slate-900">{avgScore}/100</span>
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar
                    name="Nivel inicial"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Per-skill scores */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.keys(SKILL_LABELS) as SkillKey[]).map((skill) => {
                const Icon = SKILL_ICONS[skill];
                const score = scores[skill];
                return (
                  <div key={skill} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${SKILL_COLORS[skill]} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{SKILL_LABELS[skill]}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full bg-gradient-to-r ${SKILL_COLORS[skill]}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-8 text-right">{score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
              <p className="font-medium mb-1">¿Qué sigue ahora?</p>
              <p>Los módulos de aprendizaje ya están desbloqueados. Al finalizar todos los módulos podrás realizar el <strong>Postest</strong> para medir tu progreso real.</p>
            </div>

            <button
              onClick={() => navigate('/app/modules')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Ir a los Módulos de Aprendizaje
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Questionnaire screen ────────────────────────────────────────────────
  const overallProgress = Math.round((totalAnswered / totalQuestions) * 100);
  const SectionIcon = SKILL_ICONS[section.skill];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-slate-900">Evaluación Diagnóstica — Pretest</h1>
              <p className="text-xs text-slate-500">Responde con honestidad según tu situación actual</p>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            {totalAnswered}/{totalQuestions} respondidas
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Section tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {SECTIONS.map((s, i) => {
            const Icon = SKILL_ICONS[s.skill];
            const done = s.questions.every((q) => answers[q.id] !== undefined);
            return (
              <button
                key={s.skill}
                onClick={() => setCurrentSection(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  i === currentSection
                    ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-sm'
                    : done
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.section}
                {done && i !== currentSection && <CheckCircle className="w-3 h-3 text-emerald-500" />}
              </button>
            );
          })}
        </div>

        {/* Section card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          {/* Section header */}
          <div className={`bg-gradient-to-r ${SKILL_COLORS[section.skill]} px-6 py-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <SectionIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{section.section}</h2>
                <p className="text-white/75 text-xs">
                  Sección {currentSection + 1} de {totalSections} · {section.questions.length} preguntas
                </p>
              </div>
            </div>
          </div>

          {/* Likert scale legend */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>1 = Nunca</span>
              <span>3 = A veces</span>
              <span>5 = Siempre</span>
            </div>
          </div>

          {/* Questions */}
          <div className="divide-y divide-slate-50">
            {section.questions.map((q, qi) => (
              <div key={q.id} className="px-6 py-5">
                <p className="text-sm font-medium text-slate-800 mb-4 leading-relaxed">
                  <span className="text-slate-400 mr-2 font-bold">{qi + 1}.</span>
                  {q.text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {SCALE.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleAnswer(q.id, s.value)}
                      className={`flex flex-col items-center gap-1 w-16 py-2 rounded-xl border-2 transition-all text-xs font-medium ${
                        answers[q.id] === s.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg font-extrabold">{s.value}</span>
                      <span className="text-center leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSection === 0}
            className="flex items-center gap-2 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentSection < totalSections - 1 ? (
            <button
              onClick={handleNext}
              disabled={!sectionAnswered}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Siguiente sección
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || totalAnswered < totalQuestions}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? 'Enviando...' : 'Enviar Pretest'}
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {totalAnswered < totalQuestions && currentSection === totalSections - 1 && (
          <p className="text-xs text-slate-500 text-center mt-3">
            Faltan {totalQuestions - totalAnswered} pregunta(s) sin responder en secciones anteriores
          </p>
        )}
      </div>
    </div>
  );
}
