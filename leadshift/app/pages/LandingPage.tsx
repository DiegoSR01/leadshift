import { Link } from 'react-router';
import {
  Zap,
  Users,
  Mic,
  PenTool,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Trophy,
  Brain,
  Target,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const heroImage = "https://images.unsplash.com/photo-1772657577424-1ae6f223919d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdpbmVlcmluZyUyMHN0dWRlbnRzJTIwdGVhbXdvcmslMjB1bml2ZXJzaXR5fGVufDF8fHx8MTc3Mzk0Mjk0M3ww&ixlib=rb-4.1.0&q=80&w=1080";
const presImage = "https://images.unsplash.com/photo-1765020553499-1ec9aeb21298?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcHJlc2VudGF0aW9uJTIwcHVibGljJTIwc3BlYWtpbmd8ZW58MXx8fHwxNzczOTQyOTQzfDA&ixlib=rb-4.1.0&q=80&w=1080";

const modules = [
  {
    icon: Users,
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    title: 'Liderazgo Situacional',
    desc: 'Simula escenarios reales de liderazgo y toma decisiones estratégicas con retroalimentación inmediata.',
    features: ['Simulaciones interactivas', 'Feedback basado en decisiones', 'Estilos de liderazgo'],
  },
  {
    icon: Mic,
    color: 'from-violet-500 to-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    title: 'Comunicación Oral Técnica',
    desc: 'Practica exposiciones técnicas y desarrolla habilidades de presentación con evaluación estructurada.',
    features: ['Ejercicios de exposición', 'Evaluación por rúbrica', 'Simulación de entrevistas'],
  },
  {
    icon: PenTool,
    color: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    title: 'Comunicación Escrita',
    desc: 'Desarrolla redacción técnica y síntesis de información con corrección automática y feedback.',
    features: ['Redacción técnica', 'Síntesis de información', 'Corrección automática'],
  },
  {
    icon: BarChart3,
    color: 'from-emerald-500 to-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'Dashboard de Progreso',
    desc: 'Visualiza tu evolución con métricas cuantitativas y compara tu pretest vs postest.',
    features: ['Gráficos de rendimiento', 'Métricas cuantitativas', 'Evolución temporal'],
  },
];

const stats = [
  { value: '4', label: 'Módulos de aprendizaje', icon: BookOpen },
  { value: '120+', label: 'Ejercicios prácticos', icon: Target },
  { value: '98%', label: 'Tasa de satisfacción', icon: Star },
  { value: '2,400+', label: 'Estudiantes activos', icon: Users },
];

const testimonials = [
  {
    name: 'Valentina Cruz',
    career: 'Ingeniería de Sistemas · UNAM',
    text: 'LeadShift transformó cómo me comunico en exposiciones técnicas. Pasé de nervios totales a liderar presentaciones con confianza.',
    avatar: 'V',
    color: 'bg-blue-500',
    score: 5,
  },
  {
    name: 'Diego Morales',
    career: 'Sistemas Computacionales · IPN',
    text: 'Las simulaciones de liderazgo me ayudaron a entender cómo actuar en diferentes situaciones de equipo. Muy recomendable.',
    avatar: 'D',
    color: 'bg-violet-500',
    score: 5,
  },
  {
    name: 'Sofía Ramírez',
    career: 'Ciencias de la Computación · ITESM',
    text: 'El módulo de escritura técnica me salvó. Ahora redacto informes claros y bien estructurados en la mitad del tiempo.',
    avatar: 'S',
    color: 'bg-emerald-500',
    score: 5,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">LeadShift</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#modules" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Módulos</a>
            <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Características</a>
            <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Testimonios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium px-4 py-2">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-200">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                Plataforma EdTech para Ingenieros · v2.1
              </div>
              <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6" style={{ fontSize: '3.2rem', lineHeight: 1.15 }}>
                Desarrolla las{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  habilidades blandas
                </span>{' '}
                que marcan la diferencia
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                LeadShift es la plataforma diseñada para estudiantes de ingeniería en sistemas que quieren fortalecer su liderazgo, comunicación oral y escrita con práctica guiada y retroalimentación inteligente.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                {['Liderazgo situacional', 'Comunicación técnica', 'Escritura efectiva'].map((tag) => (
                  <div key={tag} className="flex items-center gap-2 text-slate-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {tag}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-xl shadow-blue-300/40 text-sm">
                  Comenzar ahora gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="flex items-center gap-2 border border-slate-200 text-slate-700 font-medium px-6 py-3.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  Ver demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/50">
                <img src={heroImage} alt="Estudiantes de ingeniería" className="w-full h-80 object-cover" />
              </div>
              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">+42 puntos hoy</div>
                    <div className="text-xs text-slate-500">Módulo completado</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Nivel 4</div>
                    <div className="text-xs text-slate-500">Líder en Formación</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-4 h-4" />
              Módulos de aprendizaje
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4" style={{ fontSize: '2.5rem' }}>
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Cuatro módulos diseñados específicamente para las necesidades de los ingenieros en sistemas en el mundo laboral actual.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} className={`${mod.bg} border ${mod.border} rounded-2xl p-8 hover:shadow-lg transition-shadow`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{mod.title}</h3>
                  <p className="text-slate-600 text-sm mb-5 leading-relaxed">{mod.desc}</p>
                  <ul className="space-y-2">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6 bg-gradient-to-br from-slate-900 to-blue-950">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-blue-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Target className="w-4 h-4" />
              Metodología estructurada
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-6" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
              Aprendizaje basado en{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                práctica real
              </span>
            </h2>
            <div className="space-y-5">
              {[
                { icon: Brain, title: 'Simulaciones de escenarios', desc: 'Enfrenta situaciones reales de liderazgo y comunicación con consecuencias medibles.' },
                { icon: BarChart3, title: 'Métricas cuantitativas', desc: 'Mide tu evolución con indicadores claros: pretest, postest y progreso continuo.' },
                { icon: Sparkles, title: 'Feedback inteligente', desc: 'Recibe retroalimentación personalizada basada en tus respuestas y patrones de aprendizaje.' },
                { icon: Trophy, title: 'Sistema de logros', desc: 'Mantén la motivación con niveles, puntos XP y badges que reconocen tu esfuerzo.' },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">{feat.title}</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{feat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={presImage} alt="Presentación técnica" className="w-full h-96 object-cover" />
            </div>
            <div className="absolute -bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-2xl">
              <div className="text-slate-400 text-xs mb-2">Rendimiento en Comunicación Oral</div>
              <div className="flex items-end gap-1 h-12">
                {[40, 55, 50, 65, 70, 75, 82].map((h, i) => (
                  <div
                    key={i}
                    className="w-5 rounded-sm bg-gradient-to-t from-blue-600 to-violet-500 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="text-white text-sm font-bold mt-2">+42% mejora en 4 semanas</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4" style={{ fontSize: '2.5rem' }}>
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-slate-600">Más de 2,400 estudiantes ya transformaron sus habilidades profesionales</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array(t.score).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-slate-900 font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.career}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-violet-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-5" style={{ fontSize: '2.5rem' }}>
            ¿Listo para desarrollar tu potencial?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Únete a miles de ingenieros que ya están construyendo las habilidades que el mundo tecnológico necesita.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20 text-sm">
            Crear cuenta gratuita
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">LeadShift</span>
          </div>
          <p className="text-slate-500 text-sm">© 2025 LeadShift · Plataforma de Habilidades Blandas para Ingenieros</p>
        </div>
      </footer>
    </div>
  );
}
