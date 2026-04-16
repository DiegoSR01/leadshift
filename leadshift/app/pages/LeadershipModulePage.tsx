import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight, Users, CheckCircle, AlertCircle, Info,
  ChevronLeft, ArrowRight, Star, Trophy, Target, Clock,
  Lightbulb, XCircle, Brain,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const scenarios = [
  {
    id: 1,
    title: 'Conflicto en el equipo de desarrollo',
    context: 'Eres el líder técnico de un equipo de 5 desarrolladores. Dos miembros del equipo, Ana y Carlos, están en conflicto constante sobre la arquitectura del proyecto. El plazo de entrega es en 10 días. El equipo entero está desmotivado por la tensión.',
    situation: 'Ana propone usar microservicios para mayor escalabilidad. Carlos insiste en un monolito bien estructurado para cumplir el deadline. Los demás no expresan su opinión por miedo al conflicto.',
    question: '¿Cómo actuarías como líder situacional en esta situación?',
    options: [
      {
        id: 'A',
        text: 'Convocas una reunión solo con Ana y Carlos, escuchas ambas perspectivas, facilitas un debate técnico estructurado y propones una solución de compromiso que considere tanto el plazo como la escalabilidad.',
        style: 'Participativo / Coaching',
      },
      {
        id: 'B',
        text: 'Tomas una decisión unilateral basada en el plazo: "Usamos monolito ahora, refactorizamos después". Comunicas la decisión al equipo sin más debate.',
        style: 'Directivo / Autoritario',
      },
      {
        id: 'C',
        text: 'Ignoras el conflicto y dejas que el equipo resuelva solo, esperando que el problema se solucione por sí mismo.',
        style: 'Delegativo / Laissez-faire',
      },
      {
        id: 'D',
        text: 'Involucras a todo el equipo en la decisión, incluyendo a los que no hablan, creando un espacio seguro para que todos expresen su opinión técnica.',
        style: 'Democrático / Inclusivo',
      },
    ],
    bestAnswer: 'D',
    secondAnswer: 'A',
    feedback: {
      A: { score: 82, type: 'good', title: 'Buena elección — Estilo Participativo', text: 'Resuelves el conflicto directamente involucrando a las partes. Sin embargo, dejar fuera al resto del equipo puede generar la misma desconexión que existe ahora. El conflicto técnico necesita visión de equipo completo.' },
      B: { score: 55, type: 'warning', title: 'Decisión funcional pero limitada', text: 'El estilo directivo es adecuado en crisis extremas, pero aquí el problema es de dinámica de equipo, no solo técnico. Tomar la decisión solo puede generar resentimiento y no resuelve el conflicto de fondo.' },
      C: { score: 20, type: 'error', title: 'Evitación del conflicto', text: 'Ignorar el conflicto raramente funciona. Con un plazo de 10 días, la tensión crecerá y el rendimiento disminuirá. El liderazgo situacional requiere intervención activa.' },
      D: { score: 95, type: 'excellent', title: '¡Excelente! — Estilo Democrático e Inclusivo', text: 'Involucrar a todo el equipo crea sentido de pertenencia, aprovecha la inteligencia colectiva y resuelve la dinámica de miedo al conflicto. Es el enfoque más completo: técnico, humano y estratégico.' },
    },
    theory: 'Según el modelo de Liderazgo Situacional de Hersey y Blanchard, el estilo democrático (S3) es óptimo cuando el equipo tiene alta competencia técnica pero baja confianza/motivación situacional. El líder facilita, no impone.',
    xp: 95,
    level: 'Intermedio',
    tags: ['Resolución de conflictos', 'Toma de decisiones', 'Dinámica de equipo'],
  },
  {
    id: 2,
    title: 'Nuevo integrante sin experiencia',
    context: 'Acaban de asignarte un practicante, Miguel, que llega sin experiencia previa en desarrollo. El proyecto actual está en su fase crítica y tu equipo ya tiene carga de trabajo alta.',
    situation: 'Miguel está motivado pero se siente perdido. Los demás del equipo no tienen tiempo para enseñarle. Tienes que decidir cómo integrarlo al equipo.',
    question: '¿Cuál es el estilo de liderazgo más apropiado para Miguel en este momento?',
    options: [
      {
        id: 'A',
        text: 'Lo asignas a tareas de alta responsabilidad para que aprenda rápido "bajo presión". No hay tiempo para tutoriales.',
        style: 'Delegativo',
      },
      {
        id: 'B',
        text: 'Le das instrucciones muy específicas, supervisas de cerca su trabajo, explicas el "qué" y el "cómo" en cada tarea asignada.',
        style: 'Directivo / Instructivo (S1)',
      },
      {
        id: 'C',
        text: 'Lo ignoras durante la fase crítica y planeas integrarlo después cuando haya más tiempo.',
        style: 'Pasivo',
      },
      {
        id: 'D',
        text: 'Le asignas un mentor del equipo, defines objetivos de aprendizaje graduales y revisas su progreso semanalmente.',
        style: 'Coaching / Desarrollo',
      },
    ],
    bestAnswer: 'B',
    secondAnswer: 'D',
    feedback: {
      A: { score: 25, type: 'error', title: 'Alto riesgo', text: 'Poner a alguien sin experiencia en tareas críticas sin dirección es una receta para errores y frustración. Esto puede afectar tanto al proyecto como a la confianza de Miguel.' },
      B: { score: 90, type: 'excellent', title: '¡Correcto! — Estilo Directivo S1', text: 'Para una persona con alta motivación pero baja competencia (D1 en el modelo de Hersey), el estilo directivo es el más efectivo. Proporciona estructura clara, guía específica y supervisión cercana.' },
      C: { score: 10, type: 'error', title: 'Desintegración del nuevo miembro', text: 'Ignorar a un miembro nuevo daña severamente su motivación y sentido de pertenencia. En liderazgo situacional, cada persona necesita atención apropiada a su nivel.' },
      D: { score: 78, type: 'good', title: 'Buen enfoque de desarrollo', text: 'El coaching es valioso a largo plazo, pero en el contexto actual de alta carga y fase crítica, el estilo directivo es más inmediatamente efectivo para alguien que necesita guía paso a paso.' },
    },
    theory: 'El modelo D1-D4 de desarrollo indica que una persona nueva (D1: alta motivación, baja competencia) necesita el estilo S1 (Directivo): instrucciones claras, supervisión frecuente y alta orientación a la tarea.',
    xp: 88,
    level: 'Básico',
    tags: ['Onboarding', 'Estilos de liderazgo', 'Desarrollo de personas'],
  },
];

type FeedbackType = 'excellent' | 'good' | 'warning' | 'error';

const feedbackConfig: Record<FeedbackType, { bg: string; border: string; icon: LucideIcon; iconColor: string }> = {
  excellent: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Trophy, iconColor: 'text-emerald-500' },
  good: { bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, iconColor: 'text-blue-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, iconColor: 'text-amber-500' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500' },
};

export function LeadershipModulePage() {
  const { user, refreshUser } = useAuth();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.modules.get('leadership').then((data: any) => {
      setScenarios(data.scenarios || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || scenarios.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">{loading ? 'Cargando escenarios...' : 'No hay escenarios disponibles'}</div></div>;
  }

  const scenario = scenarios[currentScenario];

  const handleSubmit = async () => {
    if (!selectedOption || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.results.submitScenario(scenario.id, selectedOption);
      setFeedbackData(result.feedback?.[selectedOption] || scenario.feedback?.[selectedOption] || { score: result.score, type: result.score >= 85 ? 'excellent' : result.score >= 65 ? 'good' : result.score >= 40 ? 'warning' : 'error', title: 'Resultado', text: result.feedbackText || '' });
      setShowFeedback(true);
      refreshUser();
    } catch (e) {
      // Fallback to local feedback if API fails
      const fb = scenario.feedback?.[selectedOption];
      if (fb) { setFeedbackData(fb); setShowFeedback(true); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!completed.includes(currentScenario)) {
      setCompleted([...completed, currentScenario]);
    }
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/app/modules" className="hover:text-blue-600 transition-colors">Módulos</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Liderazgo Situacional</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Liderazgo Situacional</h1>
              <p className="text-slate-500 text-xs">Simulaciones de escenarios reales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-xl">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {user?.xp || 0} XP
            </div>
            <div className="text-sm text-slate-500">
              Escenario {currentScenario + 1} / {scenarios.length}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
            style={{ width: `${((completed.length) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main scenario */}
          <div className="lg:col-span-2 space-y-5">
            {/* Scenario card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Escenario {currentScenario + 1}
                    </span>
                    <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                      {scenario.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    ~5 min
                  </div>
                </div>
                <h2 className="text-white font-bold text-lg" style={{ fontSize: '1.1rem' }}>{scenario.title}</h2>
              </div>

              <div className="p-6">
                {/* Context */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5" />
                    Contexto
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{scenario.context}</p>
                </div>

                {/* Situation */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5" />
                    Situación específica
                  </div>
                  <p className="text-blue-800 text-sm leading-relaxed">{scenario.situation}</p>
                </div>

                {/* Question */}
                <h3 className="font-bold text-slate-900 mb-4">{scenario.question}</h3>

                {/* Options */}
                <div className="space-y-3">
                  {scenario.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isBest = showFeedback && opt.id === scenario.bestAnswer;
                    const isSecond = showFeedback && opt.id === scenario.secondAnswer && selectedOption !== scenario.bestAnswer;
                    const isWrong = showFeedback && isSelected && opt.id !== scenario.bestAnswer && opt.id !== scenario.secondAnswer;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !showFeedback && setSelectedOption(opt.id)}
                        disabled={showFeedback}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 
                          ${showFeedback ? 'cursor-default' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/50'}
                          ${isSelected && !showFeedback ? 'border-blue-500 bg-blue-50' : ''}
                          ${!isSelected && !showFeedback ? 'border-slate-200 bg-white' : ''}
                          ${isBest ? 'border-emerald-400 bg-emerald-50' : ''}
                          ${isSecond ? 'border-blue-400 bg-blue-50' : ''}
                          ${isWrong ? 'border-red-300 bg-red-50' : ''}
                          ${isSelected && showFeedback && !isBest && !isWrong && !isSecond ? 'border-amber-400 bg-amber-50' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold
                            ${isBest ? 'bg-emerald-500 text-white' : ''}
                            ${isWrong ? 'bg-red-400 text-white' : ''}
                            ${isSelected && !showFeedback ? 'bg-blue-600 text-white' : ''}
                            ${!isSelected && !showFeedback ? 'bg-slate-100 text-slate-600' : ''}
                            ${isSecond ? 'bg-blue-500 text-white' : ''}
                          `}>
                            {isBest ? <CheckCircle className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : opt.id}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 leading-relaxed">{opt.text}</p>
                            {showFeedback && (
                              <span className="inline-block mt-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {opt.style}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit / Next */}
                {!showFeedback ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedOption || submitting}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? 'Evaluando...' : 'Evaluar respuesta'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentScenario >= scenarios.length - 1}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    {currentScenario < scenarios.length - 1 ? 'Siguiente escenario' : 'Finalizar módulo'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Feedback card */}
            {showFeedback && feedbackData && (
              <div className={`rounded-2xl border p-6 ${feedbackConfig[feedbackData.type as FeedbackType].bg} ${feedbackConfig[feedbackData.type as FeedbackType].border}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {(() => {
                        const FbIcon = feedbackConfig[feedbackData.type as FeedbackType].icon;
                        return <FbIcon className={`w-6 h-6 ${feedbackConfig[feedbackData.type as FeedbackType].iconColor}`} />;
                      })()}
                      <h3 className="font-bold text-slate-900">{feedbackData.title}</h3>
                      <span className={`ml-auto text-2xl font-extrabold ${feedbackData.score >= 85 ? 'text-emerald-600' : feedbackData.score >= 65 ? 'text-blue-600' : feedbackData.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {feedbackData.score}%
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-4">{feedbackData.text}</p>

                    {/* Theory */}
                    <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                      <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Fundamento teórico
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{scenario.theory}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-5">
            {/* Scenario navigator */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Escenarios del Módulo</h3>
              <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setCurrentScenario(i); setSelectedOption(null); setShowFeedback(false); }}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all
                      ${currentScenario === i ? 'bg-blue-50 border-2 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      {completed.includes(i) ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : currentScenario === i ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span className="truncate">{s.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* XP reward */}
            <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-sm">Recompensa</span>
              </div>
              <div className="text-3xl font-extrabold mb-1">+{scenario.xp} XP</div>
              <div className="text-blue-200 text-xs">Por completar este escenario correctamente</div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 text-sm font-bold mb-3">
                <Brain className="w-4 h-4 text-blue-500" />
                Habilidades practicadas
              </div>
              <div className="flex flex-wrap gap-2">
                {scenario.tags.map((tag) => (
                  <span key={tag} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Back */}
            <Link
              to="/app/modules"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a módulos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}