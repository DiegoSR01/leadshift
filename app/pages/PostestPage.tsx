import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  ClipboardList, ChevronRight, ChevronLeft, CheckCircle,
  Users, Mic, PenTool, Handshake, Layers, Lightbulb,
  ArrowRight, Lock, TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Re-use the same question bank ────────────────────────────────────────

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
  liderazgo: 25, comOral: 25, escritura: 25,
  equipos: 15, sintesis: 15, resolucion: 15,
};

interface Question { id: string; skill: SkillKey; section: string; text: string; }

const QUESTIONS: Question[] = [
  { id: 'l1', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Ahora puedo adaptar mi estilo de liderazgo según las necesidades y nivel de madurez de cada integrante del equipo.' },
  { id: 'l2', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Delego responsabilidades con mayor efectividad que antes de iniciar el programa.' },
  { id: 'l3', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Comunico expectativas y objetivos con mayor claridad después de practicar los escenarios del módulo.' },
  { id: 'l4', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Asumo la responsabilidad de los resultados del equipo con mayor convicción.' },
  { id: 'l5', skill: 'liderazgo', section: 'Liderazgo Situacional', text: 'Reconozco y aplico correctamente los estilos directivo, de apoyo y delegador.' },
  { id: 'o1', skill: 'comOral', section: 'Comunicación Oral', text: 'Estructuro mis exposiciones orales con mayor claridad y coherencia que antes del programa.' },
  { id: 'o2', skill: 'comOral', section: 'Comunicación Oral', text: 'Uso lenguaje corporal y contacto visual de forma más efectiva al hablar en público.' },
  { id: 'o3', skill: 'comOral', section: 'Comunicación Oral', text: 'Adapto mi vocabulario y tono con mayor facilidad a distintos tipos de audiencia.' },
  { id: 'o4', skill: 'comOral', section: 'Comunicación Oral', text: 'Escucho y respondo a los interlocutores de manera más pertinente y asertiva.' },
  { id: 'o5', skill: 'comOral', section: 'Comunicación Oral', text: 'Resumo con mayor eficacia los puntos clave de una conversación o presentación.' },
  { id: 'e1', skill: 'escritura', section: 'Comunicación Escrita', text: 'Mis documentos escritos tienen una estructura más clara y ordenada que al inicio.' },
  { id: 'e2', skill: 'escritura', section: 'Comunicación Escrita', text: 'Reviso gramática y ortografía con mayor rigurosidad antes de compartir mis escritos.' },
  { id: 'e3', skill: 'escritura', section: 'Comunicación Escrita', text: 'Adapto mi estilo de escritura al contexto y propósito con mayor precisión.' },
  { id: 'e4', skill: 'escritura', section: 'Comunicación Escrita', text: 'Sintetizo información de múltiples fuentes en resúmenes más coherentes y precisos.' },
  { id: 'e5', skill: 'escritura', section: 'Comunicación Escrita', text: 'Mis textos son más claros y comprensibles para el lector que al inicio del programa.' },
  { id: 't1', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Contribuyo con mayor compromiso al logro de los objetivos del grupo.' },
  { id: 't2', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Valoro y considero mejor las opiniones de mis compañeros.' },
  { id: 't3', skill: 'equipos', section: 'Trabajo en Equipo', text: 'Gestiono los conflictos de equipo de forma más constructiva que antes.' },
  { id: 's1', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Identifico las ideas principales de textos complejos con mayor rapidez y precisión.' },
  { id: 's2', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Produzco resúmenes más coherentes integrando información de diversas fuentes.' },
  { id: 's3', skill: 'sintesis', section: 'Capacidad de Síntesis', text: 'Presento información de forma más concisa sin perder los aspectos esenciales.' },
  { id: 'r1', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Analizo las causas de los problemas con mayor profundidad antes de proponer soluciones.' },
  { id: 'r2', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Propongo soluciones más creativas e innovadoras que al inicio del programa.' },
  { id: 'r3', skill: 'resolucion', section: 'Resolución de Problemas', text: 'Evalúo las consecuencias de mis decisiones con mayor rigor antes de implementarlas.' },
];

const SCALE = [
  { value: 1, label: 'Nunca' },
  { value: 2, label: 'Casi nunca' },
  { value: 3, label: 'A veces' },
  { value: 4, label: 'Casi siempre' },
  { value: 5, label: 'Siempre' },
];

const SECTIONS = Array.from(
  new Map(QUESTIONS.map((q) => [q.skill, q.section])).entries(),
).map(([skill, section]) => ({
  skill: skill as SkillKey,
  section,
  questions: QUESTIONS.filter((q) => q.skill === skill),
}));

function computeScores(answers: Record<string, number>): Record<SkillKey, number> {
  const skills = Object.keys(SKILL_LABELS) as SkillKey[];
  const result: Partial<Record<SkillKey, number>> = {};
  for (const skill of skills) {
    const qs = QUESTIONS.filter((q) => q.skill === skill);
    const sum = qs.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0);
    result[skill] = Math.round((sum / SKILL_MAX[skill]) * 100);
  }
  return result as Record<SkillKey, number>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function PostestPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<any>(null);
  const [pretestScores, setPretestScores] = useState<Record<string, number> | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [postScores, setPostScores] = useState<Record<SkillKey, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    Promise.all([
      api.assessments.status(),
      api.assessments.list(),
    ]).then(([s, list]) => {
      setStatus(s);
      const pre = list.find((a: any) => a.type === 'pretest');
      if (pre) setPretestScores(pre.scores);
    }).catch(console.error).finally(() => setLoadingStatus(false));
  }, [navigate]);

  if (loadingStatus) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Verificando estado...</div></div>;
  }

  // Not eligible — show locked state
  if (status && !status.postestEligible && !status.postestCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Postest bloqueado</h1>
          <p className="text-slate-500 text-sm mb-6">
            Debes completar todos los módulos de aprendizaje para desbloquear la evaluación final.
          </p>
          <Link
            to="/app/modules"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            Ir a los Módulos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Already done — show comparison
  if (status?.postestCompleted && !submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Postest ya completado</h1>
          <p className="text-slate-500 text-sm mb-6">
            Ya realizaste la evaluación final. Consulta tus resultados comparativos en la sección de Progreso.
          </p>
          <Link
            to="/app/progress"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            Ver mi Progreso
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Results screen ──────────────────────────────────────────────────────
  if (submitted && postScores && pretestScores) {
    const skills = Object.keys(SKILL_LABELS) as SkillKey[];
    const barData = skills.map((skill) => ({
      skill: SKILL_LABELS[skill],
      pretest: pretestScores[skill] ?? 0,
      postest: postScores[skill],
      delta: (postScores[skill] - (pretestScores[skill] ?? 0)),
    }));

    const radarData = skills.map((skill) => ({
      skill: SKILL_LABELS[skill],
      pretest: pretestScores[skill] ?? 0,
      postest: postScores[skill],
    }));

    const avgPre = Math.round(skills.reduce((a, s) => a + (pretestScores[s] ?? 0), 0) / skills.length);
    const avgPost = Math.round(skills.reduce((a, s) => a + postScores[s], 0) / skills.length);
    const pctChange = avgPre > 0 ? Math.round(((avgPost - avgPre) / avgPre) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-blue-700 rounded-2xl px-8 py-8 text-white text-center mb-6">
            <CheckCircle className="w-14 h-14 mx-auto mb-3 text-emerald-200" />
            <h1 className="text-2xl font-extrabold mb-1">¡Postest Completado!</h1>
            <p className="text-emerald-100 text-sm">Evaluación final registrada correctamente</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Mejora promedio: <strong className="text-white">{pctChange >= 0 ? '+' : ''}{pctChange}%</strong></span>
            </div>
          </div>

          {/* Comparison bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4">Pretest vs Postest — Comparativa de habilidades</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="skill" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pretest" name="Pretest" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="postest" name="Postest" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar overlay */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4">Perfil de habilidades — Inicial vs Final</h2>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Pretest" dataKey="pretest" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="Postest" dataKey="postest" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-3">
            <Link
              to="/app/progress"
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Ver análisis completo
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              to="/app"
              className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-medium py-3 px-6 rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Questionnaire screen ────────────────────────────────────────────────
  const section = SECTIONS[currentSection];
  const totalSections = SECTIONS.length;
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const sectionAnswered = section.questions.every((q) => answers[q.id] !== undefined);
  const overallProgress = Math.round((totalAnswered / totalQuestions) * 100);
  const SectionIcon = SKILL_ICONS[section.skill];

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const computed = computeScores(answers);
      await api.assessments.submit('postest', computed);
      setPostScores(computed);
      setSubmitted(true);
      await refreshUser();
    } catch (e: any) {
      setError(e.message || 'Error al enviar el postest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <h1 className="text-base font-bold text-slate-900">Evaluación Final — Postest</h1>
              <p className="text-xs text-slate-500">Refleja tu nivel de dominio actual tras completar los módulos</p>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            {totalAnswered}/{totalQuestions} respondidas
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-500"
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
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-sm'
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

          <div className="px-6 pt-4 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>1 = Nunca</span>
              <span>3 = A veces</span>
              <span>5 = Siempre</span>
            </div>
          </div>

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
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm scale-105'
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => { if (currentSection > 0) setCurrentSection((s) => s - 1); }}
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
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
              {submitting ? 'Enviando...' : 'Finalizar Postest'}
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
