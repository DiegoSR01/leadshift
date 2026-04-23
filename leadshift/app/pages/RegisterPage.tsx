import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { Zap, Mail, Lock, User, BookOpen, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const universities = [
  'ITToluca', 'UNAM', 'IPN', 'ITESM', 'UAM', 'BUAP', 'UANL', 'UDG', 'Otra',
];

const careers = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería en Ciencias de la Computación',
  'Ingeniería de Software',
  'Ingeniería en Tecnologías de Información',
  'Licenciatura en Informática',
  'Otra ingeniería',
];

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState(1);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, university, career, semester });
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900">LeadShift</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-1" style={{ fontSize: '1.5rem' }}>
                Crea tu cuenta
              </h1>
              <p className="text-slate-500 text-sm text-center mb-7">Paso 1 de 2 · Información personal</p>

              <form onSubmit={handleStep1} className="space-y-4">
                {error && step === 1 && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Valentina Cruz"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@universidad.edu"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-200 text-sm mt-2">
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-1" style={{ fontSize: '1.5rem' }}>
                Tu perfil académico
              </h1>
              <p className="text-slate-500 text-sm text-center mb-7">Paso 2 de 2 · Información académica</p>

              <form onSubmit={handleStep2} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Universidad / Institución</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none" required>
                      <option value="">Selecciona tu institución</option>
                      {universities.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Carrera</label>
                  <select value={career} onChange={(e) => setCareer(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" required>
                    <option value="">Selecciona tu carrera</option>
                    {careers.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semestre actual</label>
                  <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 text-xs leading-relaxed">
                      Al registrarte, acepto los términos de uso y la política de privacidad de LeadShift. La plataforma utilizará mis datos únicamente para personalizar mi experiencia de aprendizaje.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-slate-600 font-medium py-3.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                    Atrás
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
                    {loading ? 'Creando...' : 'Crear cuenta'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
