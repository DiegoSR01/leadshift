import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  ChevronRight, Trophy, Star, CheckCircle, ArrowRight,
  TrendingUp, Users, Mic, PenTool, BarChart3, Target,
  Lightbulb, Clock, Award, Download,
} from 'lucide-react';

const overallResult = {
  score: 82,
  level: 'Avanzado',
  rank: 'Top 15%',
  completedAt: '19 Mar 2026',
};

const moduleResults = [
  {
    id: 1,
    module: 'Liderazgo Situacional',
    icon: Users,
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
    score: 84,
    exercises: 7,
    bestScore: 95,
    timeSpent: '3h 20min',
    status: 'En curso',
    highlights: ['Excelente en toma de decisiones', 'Demuestra empatía en escenarios', 'Mejora en delegación'],
    improvements: ['Estilo directivo en contextos de crisis', 'Comunicación de decisiones impopulares'],
  },
  {
    id: 2,
    module: 'Comunicación Oral Técnica',
    icon: Mic,
    color: 'from-violet-500 to-violet-700',
    bg: 'bg-violet-50',
    textColor: 'text-violet-600',
    score: 79,
    exercises: 4,
    bestScore: 85,
    timeSpent: '2h 10min',
    status: 'En curso',
    highlights: ['Estructura de presentaciones mejorada', 'Manejo del tiempo adecuado'],
    improvements: ['Adaptación del lenguaje técnico al público', 'Mayor uso de ejemplos concretos'],
  },
  {
    id: 3,
    module: 'Comunicación Escrita Técnica',
    icon: PenTool,
    color: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    score: 88,
    exercises: 8,
    bestScore: 92,
    timeSpent: '4h 05min',
    status: 'Casi completo',
    highlights: ['Excelente síntesis de información técnica', 'Buena estructuración de informes', 'Vocabulario preciso'],
    improvements: ['Reducir longitud de oraciones complejas'],
  },
];

const radarData = [
  { skill: 'Liderazgo', score: 84 },
  { skill: 'Com. Oral', score: 79 },
  { skill: 'Escritura', score: 88 },
  { skill: 'Equipos', score: 80 },
  { skill: 'Síntesis', score: 75 },
  { skill: 'Decisiones', score: 85 },
];

const barData = moduleResults.map((m) => ({
  module: m.module.split(' ')[0],
  promedio: m.score,
  mejor: m.bestScore,
}));

const feedbackItems = [
  { type: 'strength', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'Demuestras alta capacidad analítica en la toma de decisiones de liderazgo.' },
  { type: 'strength', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'Tu redacción técnica es precisa y bien estructurada para el nivel del programa.' },
  { type: 'improve', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'Trabaja en la adaptación del discurso oral a diferentes perfiles de audiencia.' },
  { type: 'improve', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'Practica más los escenarios de comunicación ejecutiva bajo presión.' },
  { type: 'tip', icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Recomendamos repetir los últimos 2 escenarios del módulo de liderazgo para reforzar el estilo situacional S1.' },
];

const recommendations = [
  { icon: Users, title: 'Completa el Módulo de Liderazgo', desc: '5 escenarios más para dominar todos los estilos situacionales', href: '/app/modules/leadership', color: 'text-blue-600 bg-blue-50' },
  { icon: Mic, title: 'Sube tu puntaje en Oral', desc: 'Practica 2 ejercicios más para superar el 85/100', href: '/app/modules/oral', color: 'text-violet-600 bg-violet-50' },
  { icon: BarChart3, title: 'Revisa tu progreso detallado', desc: 'Analiza tu evolución semana a semana', href: '/app/progress', color: 'text-emerald-600 bg-emerald-50' },
];

const scoreLabel = (score: number) => {
  if (score >= 90) return { label: 'Excelente', color: 'text-emerald-600 bg-emerald-50' };
  if (score >= 80) return { label: 'Muy bueno', color: 'text-blue-600 bg-blue-50' };
  if (score >= 70) return { label: 'Bueno', color: 'text-violet-600 bg-violet-50' };
  return { label: 'En desarrollo', color: 'text-amber-600 bg-amber-50' };
};

export function ResultsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Resultados</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontSize: '1.6rem' }}>Resultados y Feedback</h1>
            <p className="text-slate-500 text-sm mt-1">Resumen de tu desempeño en el programa LeadShift</p>
          </div>
          <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar reporte
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Overall score */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-gradient-to-r from-blue-700 to-violet-800 rounded-2xl p-7 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-full opacity-10 bg-gradient-to-l from-white to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="text-blue-200 font-medium">Puntuación general del programa</span>
            </div>
            <div className="text-7xl font-extrabold mb-2">{overallResult.score}</div>
            <div className="flex items-center gap-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{overallResult.level}</span>
              <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">{overallResult.rank}</span>
            </div>
            <div className="text-blue-300 text-xs mt-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Actualizado el {overallResult.completedAt}
            </div>
          </div>

          {[
            { icon: Star, label: 'Módulos completados', value: '2/3', sub: 'En progreso', color: 'text-amber-500 bg-amber-50' },
            { icon: Award, label: 'Logros obtenidos', value: '3/6', sub: '+2 en camino', color: 'text-violet-500 bg-violet-50' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-0.5">{card.value}</div>
                  <div className="text-sm font-medium text-slate-700">{card.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.sub}</div>
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 mb-0.5">+34%</div>
              <div className="text-sm font-medium text-slate-700">Mejora promedio</div>
              <div className="text-xs text-slate-500 mt-0.5">vs evaluación inicial</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Puntajes por módulo</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="module" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="promedio" name="Promedio" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mejor" name="Mejor" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Perfil de habilidades</h3>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Puntaje" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module detail results */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Resultados por módulo</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {moduleResults.map((mod) => {
              const Icon = mod.icon;
              const sl = scoreLabel(mod.score);
              return (
                <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className={`p-5 bg-gradient-to-r ${mod.color}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">{mod.module}</span>
                    </div>
                    <div className="text-5xl font-extrabold text-white">{mod.score}</div>
                    <div className="text-white/70 text-xs mt-1">puntos promedio</div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sl.color}`}>{sl.label}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mod.timeSpent}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wide">Fortalezas</div>
                      {mod.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 mb-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {h}
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">A mejorar</div>
                      {mod.improvements.map((imp, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 mb-1.5">
                          <Target className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          {imp}
                        </div>
                      ))}
                    </div>

                    <Link
                      to={`/app/modules/${['leadership', 'oral', 'written'][mod.id - 1]}`}
                      className={`mt-4 w-full flex items-center justify-center gap-2 ${mod.bg} ${mod.textColor} font-semibold text-sm py-2.5 rounded-xl hover:opacity-80 transition-opacity`}
                    >
                      Continuar módulo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Feedback del sistema</h3>
            <div className="space-y-3">
              {feedbackItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${item.bg}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.color}`} />
                    <p className="text-sm text-slate-700">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Próximos pasos recomendados</h3>
            <div className="space-y-4">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <Link key={i} to={rec.href} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm hover:bg-slate-100 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{rec.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rec.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
