import { useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight, User, Mail, BookOpen, GraduationCap,
  Star, Trophy, Flame, Target, Edit3, Save, X,
  Shield, Bell, Globe, Lock, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const staticData = {
  level: 4,
  levelName: 'Líder en Formación',
  xp: 1240,
  nextLevelXp: 1900,
  streak: 7,
  modules: [
    { name: 'Liderazgo Situacional', progress: 65, color: 'bg-blue-500' },
    { name: 'Comunicación Oral', progress: 40, color: 'bg-violet-500' },
    { name: 'Comunicación Escrita', progress: 80, color: 'bg-cyan-500' },
  ],
  badges: ['🎯', '🔥', '⭐', '📚'],
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [notif, setNotif] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);

  const displayName = name || user?.name || 'Usuario';
  const avatar = getInitials(displayName);
  const xpPercent = (staticData.xp / staticData.nextLevelXp) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Perfil</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontSize: '1.6rem' }}>Mi Perfil</h1>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Profile hero */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-7 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-l from-blue-400 to-transparent" />
          </div>
          <div className="relative flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-xl">
                {avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border border-white/30 text-white rounded-xl px-3 py-1.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button onClick={() => setEditing(false)} className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Save className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => { setEditing(false); setName(user?.name || ''); }} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-white text-2xl font-extrabold" style={{ fontSize: '1.4rem' }}>{name}</h2>
                  <button onClick={() => setEditing(true)} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}
              <p className="text-blue-300 text-sm mb-3">{user?.career || ''}{user?.university ? ` · ${user.university}` : ''}</p>

              {/* Level badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl mb-4">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm font-medium">Nivel {staticData.level} · {staticData.levelName}</span>
              </div>

              {/* XP bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-blue-300 mb-1.5">
                  <span>{staticData.xp} XP</span>
                  <span>{staticData.nextLevelXp} XP para Nivel {staticData.level + 1}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-violet-400"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex gap-4">
              {[
                { icon: Flame, value: `${staticData.streak}`, label: 'días racha', color: 'text-orange-400' },
                { icon: Trophy, value: '3', label: 'logros', color: 'text-yellow-400' },
                { icon: Target, value: '19', label: 'ejercicios', color: 'text-blue-400' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center bg-white/10 rounded-xl px-4 py-3">
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                    <div className="text-white font-extrabold text-xl">{s.value}</div>
                    <div className="text-blue-300 text-xs">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {(['profile', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab === 'profile' ? 'Información' : 'Configuración'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Info cards */}
            <div className="md:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-5">Información académica</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { icon: User, label: 'Nombre completo', value: displayName },
                    { icon: Mail, label: 'Correo electrónico', value: user?.email || '' },
                    { icon: GraduationCap, label: 'Universidad', value: user?.university || '' },
                    { icon: BookOpen, label: 'Carrera', value: user?.career || '' },
                    { icon: Target, label: 'Semestre', value: user?.semester ? `Semestre ${user.semester}` : '' },
                    { icon: Star, label: 'Nivel', value: `${staticData.level} · ${staticData.levelName}` },
                  ].map((field, i) => {
                    const Icon = field.icon;
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          {field.label}
                        </div>
                        <div className="text-slate-900 text-sm font-medium">{field.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Module progress */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-5">Progreso en módulos</h3>
                <div className="space-y-4">
                  {staticData.modules.map((mod) => (
                    <div key={mod.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{mod.name}</span>
                        <span className="text-sm font-bold text-slate-900">{mod.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${mod.color} transition-all`} style={{ width: `${mod.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: badges */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4">Badges obtenidos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {staticData.badges.map((badge, i) => (
                    <div key={i} className="w-full aspect-square bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl flex items-center justify-center text-3xl">
                      {badge}
                    </div>
                  ))}
                  {[...Array(3 - (staticData.badges.length % 3 || 3))].map((_, i) => (
                    <div key={`empty-${i}`} className="w-full aspect-square bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex items-center justify-center text-slate-300 text-2xl">
                      +
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 mb-3">Nivel actual</h3>
                <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-1">
                  {staticData.level}
                </div>
                <div className="text-slate-700 font-semibold mb-3">{staticData.levelName}</div>
                <div className="text-slate-500 text-xs">
                  Te faltan <strong className="text-blue-600">{staticData.nextLevelXp - staticData.xp} XP</strong> para el siguiente nivel
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Bell,
                title: 'Notificaciones push',
                desc: 'Recibe recordatorios de práctica diaria',
                value: notif,
                setter: setNotif,
              },
              {
                icon: Mail,
                title: 'Resumen por email',
                desc: 'Recibe un resumen semanal de tu progreso',
                value: emailDigest,
                setter: setEmailDigest,
              },
              {
                icon: Globe,
                title: 'Perfil público',
                desc: 'Permite que otros estudiantes vean tu progreso',
                value: publicProfile,
                setter: setPublicProfile,
              },
            ].map((setting, i) => {
              const Icon = setting.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{setting.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{setting.desc}</div>
                  </div>
                  <button
                    onClick={() => setting.setter(!setting.value)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${setting.value ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${setting.value ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Cambiar contraseña</div>
                  <div className="text-xs text-slate-500">Última actualización hace 2 meses</div>
                </div>
              </div>
              <button className="w-full border border-red-200 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                Actualizar contraseña
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Privacidad de datos</div>
                  <div className="text-xs text-slate-500">Gestiona tus datos personales</div>
                </div>
              </div>
              <button className="w-full border border-blue-200 text-blue-600 text-sm font-medium py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                Ver política de privacidad
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
