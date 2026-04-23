import { useState, useEffect } from 'react';
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
import { api } from '../lib/api';

const scoreLabel = (score: number) => {
  if (score >= 90) return { label: 'Excelente', color: 'text-emerald-600 bg-emerald-50' };
  if (score >= 80) return { label: 'Muy bueno', color: 'text-blue-600 bg-blue-50' };
  if (score >= 70) return { label: 'Bueno', color: 'text-violet-600 bg-violet-50' };
  return { label: 'En desarrollo', color: 'text-amber-600 bg-amber-50' };
};

const iconMap: Record<string, any> = { leadership: Users, oral: Mic, written: PenTool };
const colorMap: Record<string, any> = {
  leadership: { color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', textColor: 'text-blue-600' },
  oral: { color: 'from-violet-500 to-violet-700', bg: 'bg-violet-50', textColor: 'text-violet-600' },
  written: { color: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-50', textColor: 'text-cyan-600' },
};

export function ResultsPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.results().then(setResults).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando resultados...</div></div>;
  }

  const overallResult = results?.overall || { score: 0, level: 'Principiante', totalExercises: 0 };
  const moduleResults = results?.moduleResults || [];
  const radarData = results?.radarData || [];
  const barData = moduleResults.map((mod: any) => ({ module: mod.title, promedio: mod.score || 0, mejor: mod.bestScore || 0 }));
  const feedbackItems = results?.feedback || [];
  const recommendations = results?.recommendations || [];
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
          <button
            onClick={() => {
              const lines = [
                'REPORTE LEADSHIFT - RESULTADOS',
                `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
                `Puntuación general: ${overallResult.score}`,
                `Nivel: ${overallResult.level}`,
                '',
                'RESULTADOS POR MÓDULO:',
                ...moduleResults.map((mod: any) => `  ${mod.title}: ${mod.score} pts (${mod.exercises || 0} ejercicios)`),
                '',
                'FEEDBACK:',
                ...feedbackItems.map((item: any) => `  [${item.type}] ${item.text}`),
              ];
              const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `leadshift-resultados-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
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
              <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">{overallResult.totalExercises} ejercicios</span>
            </div>
          </div>

          {[
            { icon: Star, label: 'Módulos completados', value: `${moduleResults.filter((m: any) => m.status === 'Completado').length}/${moduleResults.length}`, sub: 'En progreso', color: 'text-amber-500 bg-amber-50' },
            { icon: Award, label: 'Ejercicios totales', value: String(overallResult.totalExercises || 0), sub: 'Completados', color: 'text-violet-500 bg-violet-50' },
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
              <div className="text-3xl font-extrabold text-slate-900 mb-0.5">{overallResult.score || 0}</div>
              <div className="text-sm font-medium text-slate-700">Puntaje promedio</div>
              <div className="text-xs text-slate-500 mt-0.5">General del programa</div>
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
            {moduleResults.map((mod: any) => {
              const type = mod.type || 'leadership';
              const Icon = iconMap[type] || Users;
              const colors = colorMap[type] || colorMap.leadership;
              const sl = scoreLabel(mod.score);
              return (
                <div key={mod.moduleId || mod.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className={`p-5 bg-gradient-to-r ${colors.color}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">{mod.title}</span>
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
                      {(mod.highlights || []).map((h: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 mb-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {h}
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">A mejorar</div>
                      {(mod.improvements || []).map((imp: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 mb-1.5">
                          <Target className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          {imp}
                        </div>
                      ))}
                    </div>

                    <Link
                      to={`/app/modules/${type}`}
                      className={`mt-4 w-full flex items-center justify-center gap-2 ${colors.bg} ${colors.textColor} font-semibold text-sm py-2.5 rounded-xl hover:opacity-80 transition-opacity`}
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
              {feedbackItems.map((item: any, i: number) => {
                const feedbackIconMap: Record<string, any> = { strength: CheckCircle, improve: Target, tip: Lightbulb };
                const feedbackColorMap: Record<string, any> = { strength: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' }, improve: { color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' }, tip: { color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' } };
                const Icon = feedbackIconMap[item.type] || Lightbulb;
                const styles = feedbackColorMap[item.type] || feedbackColorMap.tip;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${styles.bg}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${styles.color}`} />
                    <p className="text-sm text-slate-700">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Próximos pasos recomendados</h3>
            <div className="space-y-4">
              {recommendations.map((rec: any, i: number) => {
                const recIconMap: Record<string, any> = { leadership: Users, oral: Mic, written: PenTool, progress: BarChart3 };
                const Icon = recIconMap[rec.iconType] || BarChart3;
                return (
                  <Link key={i} to={rec.href || '/app/progress'} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm hover:bg-slate-100 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.color || 'text-blue-600 bg-blue-50'}`}>
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
