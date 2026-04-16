import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  ChevronRight, TrendingUp, Trophy, Target, BarChart3,
  CheckCircle, Calendar, Star, Zap, ArrowUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function ProgressPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.analytics().then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando progreso...</div></div>;
  }

  const pretestData = analytics?.pretestVsPostest || [];
  const weeklyProgress = analytics?.weeklyProgress || [];
  const moduleScores = analytics?.moduleScores || [];
  const xpHistory = analytics?.xpHistory || [];
  const achievements = analytics?.achievements || [];
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Progreso</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontSize: '1.6rem' }}>Mi Progreso</h1>
            <p className="text-slate-500 text-sm mt-1">Análisis detallado de tu evolución y desempeño</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl px-4 py-2.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Semana 8 de 12</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Mejora promedio', value: analytics?.improvement || '0%', sub: 'vs pretest inicial', color: 'text-emerald-500 bg-emerald-50', trend: analytics?.improvement },
            { icon: Zap, label: 'XP acumulados', value: String(user?.xp || 0), sub: 'Total', color: 'text-blue-500 bg-blue-50', trend: null },
            { icon: CheckCircle, label: 'Ejercicios completados', value: analytics?.exercisesCompleted || '0/0', sub: analytics?.completionPct || '0% del programa', color: 'text-violet-500 bg-violet-50', trend: null },
            { icon: Trophy, label: 'Mejor puntaje', value: analytics?.bestScore || '0', sub: analytics?.bestScoreContext || '', color: 'text-amber-500 bg-amber-50', trend: null },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{kpi.value}</div>
                <div className="text-sm font-medium text-slate-700 mt-0.5">{kpi.label}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  {kpi.trend && <ArrowUp className="w-3 h-3 text-emerald-500" />}
                  {kpi.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pretest vs Postest */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Pretest vs Postest — Comparativa de habilidades</h3>
              <p className="text-slate-500 text-sm mt-1">Evolución desde la evaluación inicial hasta el estado actual</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-500">Pretest</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-500">Postest</span>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pretestData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="skill" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="pretest" name="Pretest" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="postest" name="Postest" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>

            {/* Delta table */}
            <div className="space-y-3">
              {pretestData.map((d: any) => {
                const delta = (d.postest || 0) - (d.pretest || 0);
                const pct = d.pretest > 0 ? Math.round((delta / d.pretest) * 100) : 0;
                return (
                  <div key={d.skill} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium text-slate-700">{d.skill}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-8 text-right">{d.pretest}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 relative">
                        <div className="absolute left-0 top-0 h-2 rounded-full bg-slate-300" style={{ width: `${d.pretest}%` }} />
                        <div className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${d.postest}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8">{d.postest}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 w-14 justify-end">
                      <ArrowUp className="w-3 h-3" />+{pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly progress + Module scores */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Progreso semanal por módulo</h3>
            <p className="text-slate-500 text-sm mb-5">Evolución de puntaje promedio en 8 semanas</p>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[30, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="liderazgo" name="Liderazgo" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="oral" name="Oral" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="escritura" name="Escritura" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">XP Acumulados</h3>
            <p className="text-slate-500 text-sm mb-5">Puntos ganados a lo largo del programa</p>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={xpHistory}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="xp" name="XP" stroke="#f59e0b" strokeWidth={2.5} fill="url(#xpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module scores */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-5">Rendimiento por módulo</h3>
          <div className="grid md:grid-cols-3 gap-5">
            {moduleScores.map((mod: any, i: number) => {
              const colors = [
                { grad: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-600' },
                { grad: 'from-violet-500 to-violet-700', bg: 'bg-violet-50', text: 'text-violet-600' },
                { grad: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-50', text: 'text-cyan-600' },
              ][i];
              return (
                <div key={mod.module} className={`${colors.bg} rounded-2xl p-5`}>
                  <h4 className="font-bold text-slate-900 mb-4">{mod.module}</h4>
                  <div className="flex items-end gap-2 mb-3">
                    <span className={`text-4xl font-extrabold ${colors.text}`}>{mod.score}</span>
                    <span className="text-slate-500 text-sm mb-1">/ 100 promedio</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2.5 mb-3">
                    <div className={`h-2.5 rounded-full bg-gradient-to-r ${colors.grad}`} style={{ width: `${mod.score}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{mod.attempts} intentos</span>
                    <span className="font-semibold text-slate-700">Mejor: {mod.best}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-5">Logros y badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((ach: any, i: number) => (
              <div key={i} className={`rounded-2xl p-4 text-center transition-all ${ach.earned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200' : 'bg-slate-50 border border-slate-100 opacity-50 grayscale'}`}>
                <div className="text-3xl mb-2">{ach.icon}</div>
                <div className="text-xs font-bold text-slate-900 mb-1">{ach.title}</div>
                <div className="text-xs text-slate-500">{ach.desc}</div>
                {ach.earned && ach.date && (
                  <div className="text-xs text-amber-600 mt-2 font-medium">{ach.date}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
