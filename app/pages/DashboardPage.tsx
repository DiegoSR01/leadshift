import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from 'recharts';
import {
  Flame, Trophy, Star, Target, ArrowRight, Clock,
  Users, Mic, PenTool, BarChart3, CheckCircle2,
  TrendingUp, Zap, BookOpen, ChevronRight, Bell,
  Calendar,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const defaultRadarData = [
  { skill: 'Liderazgo', score: 0 },
  { skill: 'Com. Oral', score: 0 },
  { skill: 'Escritura', score: 0 },
  { skill: 'Trabajo en equipo', score: 0 },
  { skill: 'Síntesis', score: 0 },
  { skill: 'Resolución', score: 0 },
];

const iconMap: Record<string, any> = { Users, Mic, PenTool };
const colorMap: Record<string, { color: string; lightBg: string; textColor: string }> = {
  leadership: { color: 'from-blue-500 to-blue-700', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
  oral: { color: 'from-violet-500 to-violet-700', lightBg: 'bg-violet-50', textColor: 'text-violet-600' },
  written: { color: 'from-cyan-500 to-cyan-700', lightBg: 'bg-cyan-50', textColor: 'text-cyan-600' },
};
const activityIcons: Record<string, { icon: any; color: string }> = {
  leadership: { icon: Users, color: 'text-blue-500 bg-blue-50' },
  oral: { icon: Mic, color: 'text-violet-500 bg-violet-50' },
  written: { icon: PenTool, color: 'text-cyan-500 bg-cyan-50' },
};

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    api.dashboard.get().then(setDashboard).catch(console.error).finally(() => setLoading(false));
    // Fetch real achievements as notifications
    api.dashboard.analytics().then((data: any) => {
      const earned = (data.achievements || [])
        .filter((a: any) => a.earned)
        .sort((a: any, b: any) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
        .slice(0, 5)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          earnedAt: a.earnedAt,
        }));
      setNotifications(earned);
    }).catch(() => {});
  }, []);

  const radarData = dashboard?.radarData || defaultRadarData;
  const progressData = (dashboard?.weeklyProgress || []).map((w: any) => ({ week: w.week, score: w.avgScore ?? w.score ?? 0 }));
  const recentActivity = dashboard?.recentActivity || [];
  const moduleProgress = dashboard?.moduleProgress || [];
  const kpis = dashboard?.kpis || { streak: 0, xp: 0, modulesCompleted: 0, totalModules: 0, avgScore: 0 };
  const userName = user?.name?.split(' ')[0] || 'Estudiante';

  const currentWeek = Math.min(12, Math.max(1, Math.ceil(
    (Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )));
  const scoreImprovement = progressData.length >= 2
    ? progressData[progressData.length - 1].score - progressData[0].score
    : 0;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando dashboard...</div></div>;
  }
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.25rem' }}>Dashboard</h1>
          <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
                  Logros recientes
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">Sin logros aún. ¡Sigue practicando!</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3 border-b border-slate-50 last:border-0">
                        <span className="text-lg">{n.icon || '🏅'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{n.title}</div>
                          <div className="text-xs text-slate-500 truncate">{n.description}</div>
                          {n.earnedAt && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(n.earnedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.name || 'Usuario'}</div>
              <div className="text-xs text-slate-500">{user?.career || 'Estudiante'} · {user?.university || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-700 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10">
            <div className="w-full h-full bg-white rounded-l-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="text-white/80 text-sm">Racha de {kpis.streak} días activa 🔥</span>
            </div>
            <h2 className="text-white text-2xl font-extrabold mb-1" style={{ fontSize: '1.5rem' }}>
              ¡Hola, {userName}! 👋
            </h2>
            <p className="text-blue-100 text-sm">¡Sigue avanzando en tu desarrollo de habilidades!</p>
          </div>
          <Link
            to="/app/modules"
            className="hidden md:flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm flex-shrink-0 shadow-lg"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Flame, label: 'Días seguidos', value: String(kpis.streak), sub: 'Racha activa', color: 'text-orange-500 bg-orange-50' },
            { icon: Zap, label: 'Puntos XP', value: String(kpis.xp), sub: 'Acumulados', color: 'text-blue-500 bg-blue-50' },
            { icon: BookOpen, label: 'Módulos', value: `${kpis.modulesCompleted}/${kpis.totalModules}`, sub: 'Completados', color: 'text-violet-500 bg-violet-50' },
            { icon: Trophy, label: 'Promedio', value: String(kpis.avgScore), sub: 'General', color: 'text-amber-500 bg-amber-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mb-0.5">{stat.value}</div>
                <div className="text-sm font-medium text-slate-700">{stat.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Perfil de Habilidades</h3>
                <p className="text-slate-500 text-xs mt-0.5">Evaluación actual de competencias</p>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Target className="w-3.5 h-3.5" />
                Semana {currentWeek}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Puntaje" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Progreso General</h3>
                <p className="text-slate-500 text-xs mt-0.5">Puntuación promedio por semana</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                {scoreImprovement >= 0 ? '+' : ''}{scoreImprovement} pts
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[30, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module progress + Recent activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Module progress */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-base">Módulos en Curso</h3>
              <Link to="/app/modules" className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-5">
              {moduleProgress.map((mod: any, i: number) => {
                const type = mod.type || 'leadership';
                const colors = colorMap[type] || colorMap.leadership;
                const Icon = type === 'oral' ? Mic : type === 'written' ? PenTool : Users;
                const href = type === 'oral' ? '/app/modules/oral' : type === 'written' ? '/app/modules/written' : '/app/modules/leadership';
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{mod.title}</span>
                        <span className="text-sm font-bold text-slate-700 ml-2">{mod.totalItems > 0 ? Math.round((mod.completedItems / mod.totalItems) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${colors.color} transition-all duration-500`}
                          style={{ width: `${mod.totalItems > 0 ? Math.round((mod.completedItems / mod.totalItems) * 100) : 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{mod.completedItems || 0}/{mod.totalItems || 0} ejercicios</div>
                    </div>
                    <Link to={href} className={`${colors.lightBg} ${colors.textColor} text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity`}>
                      Continuar
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-5">Actividad Reciente</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">Sin actividad reciente</p>
              ) : recentActivity.map((act: any, i: number) => {
                const actType = act.type === 'scenario' ? 'leadership' : act.type;
                const actInfo = activityIcons[actType] || activityIcons.leadership;
                const Icon = actInfo.icon;
                const typeLabels: Record<string, string> = { scenario: 'Liderazgo', leadership: 'Liderazgo', oral: 'Com. Oral', written: 'Com. Escrita' };
                const timeAgo = act.completedAt ? new Date(act.completedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '';
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${actInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-700">{typeLabels[act.type] || act.type}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">Ejercicio completado</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-emerald-600 font-medium">{act.score} pts · +{act.xpEarned} XP</span>
                        <span className="text-xs text-slate-400">{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming tasks placeholder */}
      </div>
    </div>
  );
}
