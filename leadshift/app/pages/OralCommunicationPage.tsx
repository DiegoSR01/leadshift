import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  Mic, ChevronRight, ChevronLeft, Play, Pause, Square,
  CheckCircle, Clock, RotateCcw, ArrowRight, Star,
  Volume2, List, Target, Award, BookOpen, AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const exercises = [
  {
    id: 1,
    title: 'Presentación de arquitectura de software',
    type: 'Exposición técnica',
    duration: 3,
    difficulty: 'Intermedio',
    description: 'Explica la arquitectura de un sistema de e-commerce utilizando el patrón MVC. Tu audiencia son desarrolladores junior sin experiencia en arquitecturas de software.',
    prompt: `Tema: Arquitectura MVC para un sistema de e-commerce

Puntos a cubrir:
• ¿Qué es el patrón MVC y para qué sirve?
• Cómo se aplica en el sistema de e-commerce
• Ventajas de esta arquitectura para el proyecto
• Ejemplo concreto de flujo de datos en el sistema

Audiencia: Desarrolladores junior
Tiempo: 3 minutos`,
    criteria: [
      { label: 'Claridad conceptual', weight: 25, description: 'Explica conceptos técnicos de forma comprensible' },
      { label: 'Estructura lógica', weight: 20, description: 'Introduce, desarrolla y concluye coherentemente' },
      { label: 'Vocabulario técnico', weight: 20, description: 'Usa terminología apropiada y precisa' },
      { label: 'Adaptación al público', weight: 20, description: 'Ajusta el lenguaje a desarrolladores junior' },
      { label: 'Fluidez y seguridad', weight: 15, description: 'Habla con confianza, sin titubeos excesivos' },
    ],
    tips: [
      'Comienza con una analogía simple antes de entrar en tecnicismos',
      'Usa ejemplos del mundo real para ilustrar el flujo MVC',
      'Mantén contacto visual con la audiencia',
      'Estructura: Introducción (30s) → Desarrollo (2min) → Conclusión (30s)',
    ],
    lastScore: null,
  },
  {
    id: 2,
    title: 'Informe de estado de proyecto',
    type: 'Comunicación ejecutiva',
    duration: 5,
    difficulty: 'Avanzado',
    description: 'Informa a un stakeholder no técnico sobre el estado actual del proyecto, los riesgos identificados y las acciones correctivas propuestas.',
    prompt: `Escenario: Reunión de seguimiento con el director de TI

El proyecto está con 2 semanas de retraso. Necesitas:
• Explicar el estado actual sin tecnicismos excesivos
• Presentar los 3 riesgos principales identificados
• Proponer 2 acciones correctivas concretas
• Mantener una postura profesional y soluciones orientadas

Audiencia: Director de TI (visión de negocio, no técnica)
Tiempo: 5 minutos`,
    criteria: [
      { label: 'Mensaje principal claro', weight: 25, description: 'Comunica el estado de forma directa y honesta' },
      { label: 'Comunicación de riesgos', weight: 25, description: 'Identifica y explica riesgos de forma comprensible' },
      { label: 'Orientación a soluciones', weight: 20, description: 'Propone acciones concretas, no solo problemas' },
      { label: 'Lenguaje de negocio', weight: 20, description: 'Traduce aspectos técnicos a impacto de negocio' },
      { label: 'Manejo de preguntas', weight: 10, description: 'Anticipa preguntas y prepara respuestas' },
    ],
    tips: [
      'Empieza con el resumen ejecutivo: estado, fecha estimada de finalización',
      'Cuantifica los riesgos: "Riesgo de retraso adicional de X semanas"',
      'Por cada problema, presenta su solución inmediatamente',
      'Cierra con un mensaje positivo y comprometido',
    ],
    lastScore: 78,
  },
];

const scoreColors = (score: number) => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-red-600';
};

export function OralCommunicationPage() {
  const { refreshUser } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [phase, setPhase] = useState<'select' | 'prep' | 'record' | 'result'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selfEval, setSelfEval] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.modules.get('oral').then((data: any) => {
      setExercises(data.exercises || []);
    }).catch(console.error).finally(() => setLoadingExercises(false));
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRecording(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording, isPaused]);

  const startRecording = () => {
    if (!selectedExercise) return;
    setTimeLeft(selectedExercise.duration * 60);
    setElapsed(0);
    setIsRecording(true);
    setIsPaused(false);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitting(true);
    try {
      const result = await api.results.submitOral(selectedExercise.id, `Presentación oral simulada sobre: ${selectedExercise.title}. Duración: ${elapsed} segundos.`);
      setResultData({
        total: result.score,
        breakdown: result.feedback?.breakdown || selectedExercise.criteria?.map((c: any) => ({ ...c, score: Math.floor(65 + Math.random() * 30) })) || [],
      });
      refreshUser();
    } catch {
      setResultData({
        total: 75,
        breakdown: selectedExercise.criteria?.map((c: any) => ({ ...c, score: Math.floor(65 + Math.random() * 30) })) || [],
      });
    } finally {
      setSubmitting(false);
      setPhase('result');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectExercise = (ex: any) => {
    setSelectedExercise(ex);
    setPhase('prep');
    setSelfEval({});
    setElapsed(0);
    setResultData(null);
  };

  if (loadingExercises) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando ejercicios...</div></div>;
  }

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/app/modules" className="hover:text-blue-600 transition-colors">Módulos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Comunicación Oral</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Comunicación Oral Técnica</h1>
              <p className="text-slate-500 text-xs">Ejercicios de presentación con evaluación estructurada</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto">
          <div className="grid gap-5">
            {exercises.map((ex) => (
              <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">{ex.type}</span>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{ex.difficulty}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {ex.duration} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{ex.description}</p>
                  </div>
                  {ex.lastScore && (
                    <div className="ml-4 text-center flex-shrink-0">
                      <div className={`text-2xl font-extrabold ${scoreColors(ex.lastScore)}`}>{ex.lastScore}</div>
                      <div className="text-xs text-slate-500">última vez</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5" />
                      {ex.criteria.length} criterios
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      {ex.tips.length} consejos
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectExercise(ex)}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    {ex.lastScore ? 'Repetir ejercicio' : 'Iniciar ejercicio'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'prep' && selectedExercise) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <button onClick={() => setPhase('select')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-1">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="font-bold text-slate-900">{selectedExercise.title}</h1>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Prompt */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 text-violet-700 font-bold mb-4">
              <BookOpen className="w-5 h-5" />
              Indicaciones del ejercicio
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{selectedExercise.prompt}</pre>
          </div>

          {/* Tips + Criteria */}
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-3">
                <AlertCircle className="w-5 h-5" />
                Consejos clave
              </div>
              <ul className="space-y-2">
                {selectedExercise.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 font-bold mb-3">
                <Target className="w-5 h-5 text-violet-500" />
                Criterios de evaluación
              </div>
              <div className="space-y-3">
                {selectedExercise.criteria.map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">{c.label}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </div>
                    <span className="text-sm font-bold text-violet-600 ml-3">{c.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { startRecording(); setPhase('record'); }}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-200 text-sm"
            >
              <Mic className="w-5 h-5" />
              Comenzar presentación ({selectedExercise.duration} min)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'record' && selectedExercise) {
    const progress = (elapsed / (selectedExercise.duration * 60)) * 100;
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <div className="text-slate-400 text-sm mb-2">{selectedExercise.title}</div>
          <h2 className="text-white text-2xl font-bold">Estás presentando</h2>
        </div>

        {/* Big timer */}
        <div className="relative w-52 h-52 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeLeft < 30 ? '#ef4444' : timeLeft < 60 ? '#f59e0b' : '#8b5cf6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-extrabold ${timeLeft < 30 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-slate-400 text-sm mt-1">restante</div>
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && !isPaused && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-5 py-2.5 rounded-full mb-8 animate-pulse">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Presentando — {formatTime(elapsed)} transcurrido</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-colors"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          <button
            onClick={stopRecording}
            className="w-16 h-16 bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-900/50 hover:opacity-90 transition-opacity"
          >
            <Square className="w-7 h-7" />
          </button>
          <button
            onClick={() => { setIsRecording(false); if (intervalRef.current) clearInterval(intervalRef.current); startRecording(); }}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6 mt-8 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pausar</div>
          <div className="flex items-center gap-1.5"><Square className="w-3.5 h-3.5" /> Finalizar</div>
          <div className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reiniciar</div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && selectedExercise && resultData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="font-bold text-slate-900">Resultados — {selectedExercise.title}</h1>
        </div>
        <div className="px-8 py-6 max-w-3xl mx-auto space-y-5">
          {/* Score hero */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-900 rounded-2xl p-7 text-center text-white">
            <div className="text-6xl font-extrabold mb-2">{resultData.total}</div>
            <div className="text-violet-200 mb-4">puntos sobre 100</div>
            <div className="flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-6 h-6 ${i < Math.round(resultData.total / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-violet-400'}`} />
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Detalle por criterio</h3>
            <div className="space-y-4">
              {resultData.breakdown.map((c: any) => (
                <div key={c.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{c.label}</span>
                    <span className={`text-sm font-bold ${scoreColors(c.score)}`}>{c.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${c.score >= 85 ? 'bg-emerald-500' : c.score >= 70 ? 'bg-blue-500' : c.score >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{c.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-violet-700 font-bold mb-3">
              <Award className="w-5 h-5" />
              Recomendaciones personalizadas
            </div>
            <ul className="space-y-2.5">
              {[
                'Trabaja en la adaptación del lenguaje técnico a tu audiencia específica',
                'Practica la estructura: Intro → Desarrollo → Conclusión de forma más marcada',
                'Incorpora más ejemplos concretos para ilustrar conceptos abstractos',
              ].map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-violet-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPhase('prep'); setElapsed(0); }} className="flex-1 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              Repetir ejercicio
            </button>
            <button onClick={() => setPhase('select')} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              Siguiente ejercicio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
