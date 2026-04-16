import { Link } from 'react-router';
import { Users, Mic, PenTool, Lock, CheckCircle, ArrowRight, Star, Clock, BookOpen, ChevronRight, Zap } from 'lucide-react';

const modules = [
  {
    icon: Users,
    title: 'Liderazgo Situacional',
    description: 'Desarrolla tu capacidad de adaptarte a diferentes estilos de liderazgo según el contexto y las personas del equipo.',
    href: '/app/modules/leadership',
    color: 'from-blue-500 to-blue-700',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-600',
    progress: 65,
    totalScenarios: 12,
    completedScenarios: 7,
    avgScore: 8.2,
    duration: '45 min/sesión',
    level: 'Intermedio',
    locked: false,
    badge: 'En curso',
    badgeColor: 'bg-blue-100 text-blue-700',
    skills: ['Toma de decisiones', 'Gestión de equipos', 'Adaptabilidad', 'Resolución de conflictos'],
  },
  {
    icon: Mic,
    title: 'Comunicación Oral Técnica',
    description: 'Mejora tus habilidades de presentación y exposición técnica ante diferentes audiencias con evaluación por rúbricas.',
    href: '/app/modules/oral',
    color: 'from-violet-500 to-violet-700',
    lightBg: 'bg-violet-50',
    border: 'border-violet-200',
    textColor: 'text-violet-600',
    progress: 40,
    totalScenarios: 10,
    completedScenarios: 4,
    avgScore: 7.8,
    duration: '30 min/sesión',
    level: 'Básico-Intermedio',
    locked: false,
    badge: 'En curso',
    badgeColor: 'bg-violet-100 text-violet-700',
    skills: ['Estructura de presentaciones', 'Lenguaje técnico', 'Claridad', 'Gestión del nerviosismo'],
  },
  {
    icon: PenTool,
    title: 'Comunicación Escrita Técnica',
    description: 'Domina la redacción de documentos técnicos, informes y síntesis orientadas a la comunicación profesional efectiva.',
    href: '/app/modules/written',
    color: 'from-cyan-500 to-cyan-700',
    lightBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    textColor: 'text-cyan-600',
    progress: 80,
    totalScenarios: 10,
    completedScenarios: 8,
    avgScore: 8.6,
    duration: '40 min/sesión',
    level: 'Avanzado',
    locked: false,
    badge: 'Casi completo',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    skills: ['Redacción técnica', 'Síntesis', 'Estructura documental', 'Claridad conceptual'],
  },
  {
    icon: Zap,
    title: 'Trabajo en Equipo Ágil',
    description: 'Aprende metodologías ágiles y dinámicas colaborativas para mejorar el desempeño de tu equipo de desarrollo.',
    href: '#',
    color: 'from-amber-500 to-amber-700',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-600',
    progress: 0,
    totalScenarios: 8,
    completedScenarios: 0,
    avgScore: 0,
    duration: '35 min/sesión',
    level: 'Intermedio',
    locked: true,
    badge: 'Próximamente',
    badgeColor: 'bg-amber-100 text-amber-700',
    skills: ['Scrum', 'Comunicación en equipo', 'Retroalimentación', 'Roles y responsabilidades'],
  },
];

export function ModulesPage() {
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
              <span className="font-semibold text-slate-900">2</span> módulos activos
            </div>
            <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2 text-sm font-medium">
              Nivel 4 · Líder en Formación
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'XP Total', value: '1,240', icon: Zap, color: 'text-blue-600 bg-blue-50' },
            { label: 'Ejercicios completos', value: '19/32', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Promedio general', value: '8.2', icon: Star, color: 'text-amber-600 bg-amber-50' },
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
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${mod.locked ? 'border-slate-100 opacity-75' : 'border-slate-100 hover:shadow-md hover:-translate-y-0.5'}`}>
                {/* Card header */}
                <div className={`p-6 pb-0`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center`}>
                      {mod.locked ? <Lock className="w-6 h-6 text-white" /> : <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${mod.badgeColor}`}>
                        {mod.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{mod.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {mod.skills.map((skill) => (
                      <span key={skill} className={`text-xs ${mod.lightBg} ${mod.textColor} px-2.5 py-1 rounded-lg font-medium`}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-5 text-sm text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      {mod.completedScenarios}/{mod.totalScenarios} ejercicios
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {mod.duration}
                    </div>
                    {!mod.locked && mod.avgScore > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400" />
                        {mod.avgScore}/10
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!mod.locked && (
                    <div className="mb-5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-slate-500">Progreso</span>
                        <span className="text-xs font-bold text-slate-700">{mod.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${mod.color} transition-all duration-500`}
                          style={{ width: `${mod.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className={`px-6 py-4 border-t border-slate-100 ${mod.lightBg}`}>
                  {mod.locked ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Disponible próximamente</span>
                    </div>
                  ) : (
                    <Link
                      to={mod.href}
                      className={`flex items-center justify-between w-full group`}
                    >
                      <span className={`text-sm font-semibold ${mod.textColor}`}>
                        {mod.progress === 0 ? 'Comenzar módulo' : mod.progress === 100 ? 'Repasar módulo' : 'Continuar módulo'}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${mod.textColor} group-hover:translate-x-1 transition-transform`} />
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
