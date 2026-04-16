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

const radarData = [
  { skill: 'Liderazgo', score: 72 },
  { skill: 'Com. Oral', score: 65 },
  { skill: 'Escritura', score: 78 },
  { skill: 'Trabajo en equipo', score: 80 },
  { skill: 'Síntesis', score: 60 },
  { skill: 'Resolución', score: 70 },
];

const progressData = [
  { week: 'S1', score: 45 },
  { week: 'S2', score: 52 },
  { week: 'S3', score: 58 },
  { week: 'S4', score: 55 },
  { week: 'S5', score: 68 },
  { week: 'S6', score: 72 },
  { week: 'S7', score: 78 },
  { week: 'S8', score: 82 },
];

const recentActivity = [
  { icon: Users, color: 'text-blue-500 bg-blue-50', label: 'Liderazgo Situacional', action: 'Escenario 3 completado', score: '+42 XP', time: 'Hace 2h' },
  { icon: Mic, color: 'text-violet-500 bg-violet-50', label: 'Comunicación Oral', action: 'Ejercicio de exposición evaluado', score: '+38 XP', time: 'Ayer' },
  { icon: PenTool, color: 'text-cyan-500 bg-cyan-50', label: 'Escritura Técnica', action: 'Síntesis calificada: 8.5/10', score: '+55 XP', time: 'Hace 2 días' },
];

const modules = [
  {
    icon: Users,
    title: 'Liderazgo Situacional',
    progress: 65,
    href: '/app/modules/leadership',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    scenarios: '7/12 escenarios',
  },
  {
    icon: Mic,
    title: 'Comunicación Oral',
    progress: 40,
    href: '/app/modules/oral',
    color: 'from-violet-500 to-violet-700',
    bg: 'bg-violet-500',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-600',
    scenarios: '4/10 ejercicios',
  },
  {
    icon: PenTool,
    title: 'Comunicación Escrita',
    progress: 80,
    href: '/app/modules/written',
    color: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-500',
    lightBg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    scenarios: '8/10 actividades',
  },
];

const upcomingTasks = [
  { module: 'Liderazgo', task: 'Escenario 4: Manejo de conflictos', due: 'Mañana', urgent: true },
  { module: 'Com. Oral', task: 'Presentación técnica #5', due: 'En 2 días', urgent: false },
  { module: 'Escritura', task: 'Informe técnico final', due: 'En 5 días', urgent: false },
];

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.25rem' }}>Dashboard</h1>
          <p className="text-slate-500 text-sm">Jueves, 19 de marzo 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              VC
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-slate-900">Valentina Cruz</div>
              <div className="text-xs text-slate-500">Ing. Sistemas · UNAM</div>
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
              <span className="text-white/80 text-sm">Racha de 7 días activa 🔥</span>
            </div>
            <h2 className="text-white text-2xl font-extrabold mb-1" style={{ fontSize: '1.5rem' }}>
              ¡Hola, Valentina! 👋
            </h2>
            <p className="text-blue-100 text-sm">Tienes 3 ejercicios pendientes. ¡Sigues avanzando muy bien!</p>
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
            { icon: Flame, label: 'Días seguidos', value: '7', sub: 'Racha activa', color: 'text-orange-500 bg-orange-50' },
            { icon: Zap, label: 'Puntos XP', value: '1,240', sub: '+42 hoy', color: 'text-blue-500 bg-blue-50' },
            { icon: BookOpen, label: 'Módulos', value: '2/3', sub: 'Completados', color: 'text-violet-500 bg-violet-50' },
            { icon: Trophy, label: 'Promedio', value: '8.1', sub: '↑ +0.5 esta semana', color: 'text-amber-500 bg-amber-50' },
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
                Semana 8
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
                +37 pts
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
              {modules.map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{mod.title}</span>
                        <span className="text-sm font-bold text-slate-700 ml-2">{mod.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${mod.color} transition-all duration-500`}
                          style={{ width: `${mod.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{mod.scenarios}</div>
                    </div>
                    <Link to={mod.href} className={`${mod.lightBg} ${mod.textColor} text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity`}>
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
              {recentActivity.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-700">{act.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{act.action}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-emerald-600 font-medium">{act.score}</span>
                        <span className="text-xs text-slate-400">{act.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-base">Próximas Tareas</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingTasks.map((task, i) => (
              <div key={i} className={`border rounded-xl p-4 ${task.urgent ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${task.urgent ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                    {task.module}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {task.due}
                  </div>
                </div>
                <p className="text-sm text-slate-700 font-medium">{task.task}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
