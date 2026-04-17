import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Users, Mic, PenTool, Lock, CheckCircle, ArrowRight, Star, Clock, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const iconMap: Record<string, any> = { leadership: Users, oral: Mic, written: PenTool, teamwork: Zap };
const styleMap: Record<string, any> = {
  leadership: { color: 'from-blue-500 to-blue-700', lightBg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
  oral: { color: 'from-violet-500 to-violet-700', lightBg: 'bg-violet-50', border: 'border-violet-200', textColor: 'text-violet-600', badgeColor: 'bg-violet-100 text-violet-700' },
  written: { color: 'from-cyan-500 to-cyan-700', lightBg: 'bg-cyan-50', border: 'border-cyan-200', textColor: 'text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-700' },
  teamwork: { color: 'from-amber-500 to-amber-700', lightBg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-600', badgeColor: 'bg-amber-100 text-amber-700' },
};
const hrefMap: Record<string, string> = { leadership: '/app/modules/leadership', oral: '/app/modules/oral', written: '/app/modules/written', teamwork: '#' };

export function ModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.modules.list().then(setModules).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando módulos...</div></div>;
  }

  const totalExercises = modules.reduce((acc, m) => acc + (m.completedItems || 0), 0);
  const totalAll = modules.reduce((acc, m) => acc + (m.totalItems || 0), 0);
  const avgScore = modules.filter(m => m.avgScore > 0).reduce((acc, m, _, arr) => acc + m.avgScore / arr.length, 0).toFixed(1);
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Módulos</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontSize: '1.6rem' }}>Módulos de Aprendizaje</h1>
            <p className="text-slate-500 text-sm mt-1">Elige un módulo y continúa desarrollando tus habilidades blandas</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-slate-100 rounded-xl px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{modules.filter(m => !m.locked).length}</span> módulos activos
            </div>
            <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2 text-sm font-medium">
              Nivel {user?.level || 1} · {user?.levelName || 'Principiante'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'XP Total', value: String(user?.xp || 0), icon: Zap, color: 'text-blue-600 bg-blue-50' },
            { label: 'Ejercicios completos', value: `${totalExercises}/${totalAll}`, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Promedio general', value: avgScore, icon: Star, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Module grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {modules.map((mod: any, i: number) => {
            const type = mod.type || 'leadership';
            const style = styleMap[type] || styleMap.leadership;
            const Icon = iconMap[type] || Users;
            const href = hrefMap[type] || '#';
            const badge = mod.locked ? 'Próximamente' : mod.progress >= 80 ? 'Casi completo' : mod.progress > 0 ? 'En curso' : 'Nuevo';
            return (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${mod.locked ? 'border-slate-100 opacity-75' : 'border-slate-100 hover:shadow-md hover:-translate-y-0.5'}`}>
                {/* Card header */}
                <div className={`p-6 pb-0`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center`}>
                      {mod.locked ? <Lock className="w-6 h-6 text-white" /> : <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${style.badgeColor}`}>
                        {badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{mod.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(mod.skills || []).map((skill: string) => (
                      <span key={skill} className={`text-xs ${style.lightBg} ${style.textColor} px-2.5 py-1 rounded-lg font-medium`}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-5 text-sm text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      {mod.completedItems || 0}/{mod.totalItems || 0} ejercicios
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {mod.duration || '30 min/sesión'}
                    </div>
                    {!mod.locked && (mod.avgScore || 0) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400" />
                        {Math.round(mod.avgScore)}/100
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!mod.locked && (
                    <div className="mb-5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-slate-500">Progreso</span>
                        <span className="text-xs font-bold text-slate-700">{mod.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${style.color} transition-all duration-500`}
                          style={{ width: `${mod.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className={`px-6 py-4 border-t border-slate-100 ${style.lightBg}`}>
                  {mod.locked ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Disponible próximamente</span>
                    </div>
                  ) : (
                    <Link
                      to={href}
                      className={`flex items-center justify-between w-full group`}
                    >
                      <span className={`text-sm font-semibold ${style.textColor}`}>
                        {(mod.progress || 0) === 0 ? 'Comenzar módulo' : (mod.progress || 0) === 100 ? 'Repasar módulo' : 'Continuar módulo'}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${style.textColor} group-hover:translate-x-1 transition-transform`} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
