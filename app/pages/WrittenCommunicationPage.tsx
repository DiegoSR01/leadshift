import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import {
  PenTool, ChevronRight, ChevronLeft, ArrowRight,
  CheckCircle, AlertCircle, XCircle, BarChart3,
  Target, Clock, Star, BookOpen, Lightbulb, RefreshCw,
  FileText, TrendingUp,
} from 'lucide-react';

const exercises = [
  {
    id: 1,
    title: 'Síntesis de arquitectura de microservicios',
    type: 'Síntesis técnica',
    difficulty: 'Intermedio',
    wordLimit: { min: 150, max: 250 },
    timeLimit: 20,
    instructions: `Lee el siguiente fragmento técnico y redacta una síntesis clara y concisa para un equipo de QA que no tiene experiencia en arquitecturas de backend. Tu síntesis debe:

• Explicar qué son los microservicios en términos simples
• Mencionar 2 ventajas principales para el proyecto
• Identificar el principal desafío de implementación
• Recomendar una acción concreta para el equipo de QA`,
    sourceText: `Los microservicios representan un estilo arquitectónico que estructura una aplicación como un conjunto de servicios pequeños, desplegables de forma independiente, diseñados en torno a las capacidades del negocio. Cada servicio se ejecuta en su propio proceso y se comunica mediante mecanismos ligeros, generalmente una API HTTP. Estos servicios pueden ser desplegados de forma completamente automatizada de manera independiente. La naturaleza descentralizada de los microservicios implica que cada servicio gestiona su propia base de datos, lo que permite la adopción de diferentes tecnologías de persistencia según las necesidades específicas del servicio (polyglot persistence). Sin embargo, este enfoque introduce complejidad operacional significativa: la gestión de múltiples servicios requiere infraestructura sofisticada de monitoreo, trazabilidad distribuida (distributed tracing) y orquestación de contenedores.`,
    criteria: [
      { id: 'clarity', label: 'Claridad y comprensión', weight: 30 },
      { id: 'synthesis', label: 'Síntesis efectiva', weight: 25 },
      { id: 'audience', label: 'Adaptación al público', weight: 25 },
      { id: 'structure', label: 'Estructura y coherencia', weight: 20 },
    ],
    placeholder: 'Escribe tu síntesis aquí. Recuerda adaptar el lenguaje técnico para el equipo de QA...',
  },
  {
    id: 2,
    title: 'Informe técnico de incidente de seguridad',
    type: 'Redacción técnica',
    difficulty: 'Avanzado',
    wordLimit: { min: 200, max: 350 },
    timeLimit: 30,
    instructions: `Redacta un informe ejecutivo sobre el siguiente incidente de seguridad. El informe debe dirigirse al CTO y debe incluir:

• Descripción del incidente (qué ocurrió, cuándo, impacto)
• Causa raíz identificada
• Acciones inmediatas tomadas
• Medidas preventivas propuestas
• Lecciones aprendidas`,
    sourceText: `Incidente #2024-SEC-047: El 15 de marzo a las 02:30 hrs, se detectó acceso no autorizado a la base de datos de producción. El atacante explotó una vulnerabilidad SQL injection en el módulo de búsqueda de productos. Se comprometieron 1,240 registros de usuarios (nombre, email, hash de contraseña). El sistema fue aislado a las 03:15 hrs. La vulnerabilidad existía desde la versión 2.1 del sistema, lanzada hace 8 meses. Se detectó mediante alertas de DLP del SIEM. El vector de ataque fue la falta de sanitización de parámetros en el endpoint /api/search.`,
    criteria: [
      { id: 'completeness', label: 'Completitud del informe', weight: 25 },
      { id: 'precision', label: 'Precisión técnica', weight: 30 },
      { id: 'executive', label: 'Comunicación ejecutiva', weight: 25 },
      { id: 'proposals', label: 'Propuestas concretas', weight: 20 },
    ],
    placeholder: 'Redacta el informe ejecutivo del incidente de seguridad...',
  },
];

function analyzText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
  const techWords = ['sistema', 'arquitectura', 'microservicio', 'servicio', 'api', 'base de datos', 'deploy', 'implementación', 'backend', 'vulnerabilidad', 'seguridad', 'incidente', 'protocolo'];
  const techCount = techWords.filter((w) => text.toLowerCase().includes(w)).length;
  return { words, sentences, avgWordsPerSentence, techCount };
}

export function WrittenCommunicationPage() {
  const [selectedEx, setSelectedEx] = useState<null | typeof exercises[0]>(null);
  const [phase, setPhase] = useState<'list' | 'write' | 'result'>('list');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stats = useCallback(() => analyzText(text), [text]);
  const s = stats();

  const handleSubmit = () => {
    setSubmitted(true);
    setPhase('result');
  };

  const mockFeedback = selectedEx ? {
    overallScore: 81,
    breakdown: selectedEx.criteria.map((c) => ({
      ...c,
      score: Math.floor(65 + Math.random() * 30),
    })),
    issues: [
      { type: 'warning' as const, text: 'Algunas oraciones son demasiado largas. Intenta dividirlas en ideas más cortas.' },
      { type: 'success' as const, text: 'Excelente uso de términos técnicos con definiciones claras.' },
      { type: 'info' as const, text: 'Considera agregar una conclusión más explícita con la acción recomendada.' },
    ],
    suggestions: [
      'Usa conectores lógicos: "Sin embargo", "Por lo tanto", "En consecuencia"',
      'Empieza párrafos con la idea principal, no con contexto',
      'Evita repetición de palabras en frases cercanas',
    ],
  } : null;

  const wordLimit = selectedEx?.wordLimit;
  const wordStatus = wordLimit
    ? s.words < wordLimit.min ? 'under' : s.words > wordLimit.max ? 'over' : 'ok'
    : 'ok';

  if (phase === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/app" className="hover:text-blue-600">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/app/modules" className="hover:text-blue-600">Módulos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Comunicación Escrita</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Comunicación Escrita Técnica</h1>
              <p className="text-slate-500 text-xs">Redacción y síntesis con feedback automático</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto space-y-5">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-cyan-50 text-cyan-700 text-xs font-medium px-2.5 py-1 rounded-full">{ex.type}</span>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{ex.difficulty}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />{ex.timeLimit} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />{ex.wordLimit.min}–{ex.wordLimit.max} palabras
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{ex.instructions.split('\n')[0]}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedEx(ex); setText(''); setPhase('write'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Comenzar ejercicio <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'write' && selectedEx) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <button onClick={() => setPhase('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-1">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="font-bold text-slate-900">{selectedEx.title}</h1>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Left: source + instructions */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-cyan-700 font-bold mb-3 text-sm">
                <Target className="w-4 h-4" />
                Indicaciones
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedEx.instructions}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3 text-sm">
                <BookOpen className="w-4 h-4" />
                Texto fuente
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">{selectedEx.sourceText}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-amber-600 font-bold mb-3 text-sm">
                <Lightbulb className="w-4 h-4" />
                Criterios (peso)
              </div>
              {selectedEx.criteria.map((c) => (
                <div key={c.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{c.label}</span>
                  <span className="text-sm font-bold text-cyan-600">{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Tu redacción</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    wordStatus === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                    wordStatus === 'under' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {s.words} palabras {wordLimit && `(mín. ${wordLimit.min}, máx. ${wordLimit.max})`}
                  </span>
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={selectedEx.placeholder}
                className="w-full h-64 p-5 text-slate-700 text-sm leading-relaxed resize-none focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Palabras', value: s.words, icon: BookOpen },
                { label: 'Oraciones', value: s.sentences, icon: FileText },
                { label: 'Prom. por oración', value: s.avgWordsPerSentence, icon: BarChart3 },
                { label: 'Términos técnicos', value: s.techCount, icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                    <Icon className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={s.words < (wordLimit?.min || 0)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-lg shadow-cyan-200"
            >
              <TrendingUp className="w-5 h-5" />
              Enviar para evaluación
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && selectedEx && mockFeedback) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="font-bold text-slate-900">Resultados — {selectedEx.title}</h1>
        </div>
        <div className="px-8 py-6 max-w-4xl mx-auto space-y-5">
          {/* Score */}
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-900 rounded-2xl p-7 text-white text-center">
            <div className="text-6xl font-extrabold mb-2">{mockFeedback.overallScore}</div>
            <div className="text-cyan-200 mb-4">puntuación general</div>
            <div className="flex justify-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(mockFeedback.overallScore / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-cyan-400'}`} />
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Por criterio</h3>
              {mockFeedback.breakdown.map((c) => (
                <div key={c.id} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{c.label}</span>
                    <span className="text-sm font-bold text-cyan-700">{c.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-700 transition-all"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback issues */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Feedback detallado</h3>
              <div className="space-y-3">
                {mockFeedback.issues.map((issue, i) => {
                  const config = {
                    warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
                    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
                    info: { icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
                  };
                  const c = config[issue.type];
                  const Icon = c.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.color}`} />
                      <p className="text-sm text-slate-700">{issue.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-sm font-bold text-slate-700 mb-3">Sugerencias de mejora</div>
                {mockFeedback.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                    <span className="w-5 h-5 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Your text */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Tu redacción ({s.words} palabras)</h3>
              <button onClick={() => setPhase('write')} className="flex items-center gap-1.5 text-cyan-600 text-sm hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{text || '(Sin texto ingresado)'}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPhase('write'); setText(''); }} className="flex-1 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              <RefreshCw className="w-4 h-4 inline mr-1" /> Reintentar
            </button>
            <button onClick={() => setPhase('list')} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              Siguiente ejercicio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}