import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight, Users, CheckCircle, AlertCircle, Info,
  ChevronLeft, ArrowRight, Star, Trophy, Target, Clock,
  Lightbulb, XCircle, Brain,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type FeedbackType = 'excellent' | 'good' | 'warning' | 'error';

const feedbackConfig: Record<FeedbackType, { bg: string; border: string; icon: LucideIcon; iconColor: string }> = {
  excellent: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Trophy, iconColor: 'text-emerald-500' },
  good: { bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, iconColor: 'text-blue-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, iconColor: 'text-amber-500' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500' },
};

export function LeadershipModulePage() {
  const { user, refreshUser } = useAuth();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.modules.get('leadership').then((data: any) => {
      setScenarios(data.scenarios || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || scenarios.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">{loading ? 'Cargando escenarios...' : 'No hay escenarios disponibles'}</div></div>;
  }

  const scenario = scenarios[currentScenario];

  const handleSubmit = async () => {
    if (!selectedOption || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.results.submitScenario(scenario.id, selectedOption);
      const evaluation = response.evaluation || {};
      // Use evaluation feedback if available, else fall back to scenario's local feedback
      setFeedbackData(evaluation.feedback || scenario.feedback?.[selectedOption] || {
        score: evaluation.score ?? response.result?.score ?? 0,
        type: (evaluation.score ?? 0) >= 85 ? 'excellent' : (evaluation.score ?? 0) >= 65 ? 'good' : (evaluation.score ?? 0) >= 40 ? 'warning' : 'error',
        title: evaluation.styleLabel || 'Resultado',
        text: evaluation.theory || '',
      });
      setShowFeedback(true);
      refreshUser();
    } catch (e) {
      // Fallback to local feedback if API fails
      const fb = scenario.feedback?.[selectedOption];
      if (fb) { setFeedbackData(fb); setShowFeedback(true); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!completed.includes(currentScenario)) {
      setCompleted([...completed, currentScenario]);
    }
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/app/modules" className="hover:text-blue-600 transition-colors">Módulos</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Liderazgo Situacional</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Liderazgo Situacional</h1>
              <p className="text-slate-500 text-xs">Simulaciones de escenarios reales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-xl">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {user?.xp || 0} XP
            </div>
            <div className="text-sm text-slate-500">
              Escenario {currentScenario + 1} / {scenarios.length}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
            style={{ width: `${((completed.length) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main scenario */}
          <div className="lg:col-span-2 space-y-5">
            {/* Scenario card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Escenario {currentScenario + 1}
                    </span>
                    <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                      {scenario.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    ~5 min
                  </div>
                </div>
                <h2 className="text-white font-bold text-lg" style={{ fontSize: '1.1rem' }}>{scenario.title}</h2>
              </div>

              <div className="p-6">
                {/* Context */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5" />
                    Contexto
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{scenario.context}</p>
                </div>

                {/* Situation */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5" />
                    Situación específica
                  </div>
                  <p className="text-blue-800 text-sm leading-relaxed">{scenario.situation}</p>
                </div>

                {/* Question */}
                <h3 className="font-bold text-slate-900 mb-4">{scenario.question}</h3>

                {/* Options */}
                <div className="space-y-3">
                  {scenario.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isBest = showFeedback && opt.id === scenario.bestAnswer;
                    const isSecond = showFeedback && opt.id === scenario.secondAnswer && selectedOption !== scenario.bestAnswer;
                    const isWrong = showFeedback && isSelected && opt.id !== scenario.bestAnswer && opt.id !== scenario.secondAnswer;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !showFeedback && setSelectedOption(opt.id)}
                        disabled={showFeedback}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 
                          ${showFeedback ? 'cursor-default' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/50'}
                          ${isSelected && !showFeedback ? 'border-blue-500 bg-blue-50' : ''}
                          ${!isSelected && !showFeedback ? 'border-slate-200 bg-white' : ''}
                          ${isBest ? 'border-emerald-400 bg-emerald-50' : ''}
                          ${isSecond ? 'border-blue-400 bg-blue-50' : ''}
                          ${isWrong ? 'border-red-300 bg-red-50' : ''}
                          ${isSelected && showFeedback && !isBest && !isWrong && !isSecond ? 'border-amber-400 bg-amber-50' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold
                            ${isBest ? 'bg-emerald-500 text-white' : ''}
                            ${isWrong ? 'bg-red-400 text-white' : ''}
                            ${isSelected && !showFeedback ? 'bg-blue-600 text-white' : ''}
                            ${!isSelected && !showFeedback ? 'bg-slate-100 text-slate-600' : ''}
                            ${isSecond ? 'bg-blue-500 text-white' : ''}
                          `}>
                            {isBest ? <CheckCircle className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : opt.id}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 leading-relaxed">{opt.text}</p>
                            {showFeedback && (
                              <span className="inline-block mt-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {opt.style}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit / Next */}
                {!showFeedback ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedOption || submitting}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? 'Evaluando...' : 'Evaluar respuesta'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentScenario >= scenarios.length - 1}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    {currentScenario < scenarios.length - 1 ? 'Siguiente escenario' : 'Finalizar módulo'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Feedback card */}
            {showFeedback && feedbackData && (
              <div className={`rounded-2xl border p-6 ${feedbackConfig[feedbackData.type as FeedbackType].bg} ${feedbackConfig[feedbackData.type as FeedbackType].border}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {(() => {
                        const FbIcon = feedbackConfig[feedbackData.type as FeedbackType].icon;
                        return <FbIcon className={`w-6 h-6 ${feedbackConfig[feedbackData.type as FeedbackType].iconColor}`} />;
                      })()}
                      <h3 className="font-bold text-slate-900">{feedbackData.title}</h3>
                      <span className={`ml-auto text-2xl font-extrabold ${feedbackData.score >= 85 ? 'text-emerald-600' : feedbackData.score >= 65 ? 'text-blue-600' : feedbackData.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {feedbackData.score}%
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-4">{feedbackData.text}</p>

                    {/* Theory */}
                    <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                      <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Fundamento teórico
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{scenario.theory}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-5">
            {/* Scenario navigator */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Escenarios del Módulo</h3>
              <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setCurrentScenario(i); setSelectedOption(null); setShowFeedback(false); }}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all
                      ${currentScenario === i ? 'bg-blue-50 border-2 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      {completed.includes(i) ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : currentScenario === i ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span className="truncate">{s.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* XP reward */}
            <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-sm">Recompensa</span>
              </div>
              <div className="text-3xl font-extrabold mb-1">+{scenario.xp} XP</div>
              <div className="text-blue-200 text-xs">Por completar este escenario correctamente</div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 text-sm font-bold mb-3">
                <Brain className="w-4 h-4 text-blue-500" />
                Habilidades practicadas
              </div>
              <div className="flex flex-wrap gap-2">
                {scenario.tags.map((tag) => (
                  <span key={tag} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Back */}
            <Link
              to="/app/modules"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a módulos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}