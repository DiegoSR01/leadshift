import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import {
  PenTool, ChevronRight, ChevronLeft, ArrowRight,
  CheckCircle, AlertCircle, XCircle, BarChart3,
  Target, Clock, Star, BookOpen, Lightbulb, RefreshCw,
  FileText, TrendingUp, Hash,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/** Local text analysis for live preview (mirrors backend NLP logic) */
function analyzeText(text: string) {
  // Words: split by whitespace, filter empty and pure-punctuation tokens
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0 && /\w/.test(w));
  const wordCount = words.length;

  // Sentences: split on sentence-ending punctuation, keep non-empty
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const sentenceCount = sentences.length;

  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Paragraphs: split on double newline
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  // Technical terms: substring match on comprehensive list
  const techTerms = [
    'arquitectura', 'microservicio', 'api', 'endpoint', 'base de datos',
    'servidor', 'escalabilidad', 'contenedor', 'docker', 'kubernetes',
    'latencia', 'throughput', 'sql', 'rest', 'http', 'framework',
    'patrón', 'módulo', 'componente', 'protocolo', 'seguridad',
    'inyección', 'vulnerabilidad', 'autenticación', 'cifrado', 'firewall',
    'incidente', 'sistema', 'red', 'log', 'monitoreo',
    'algoritmo', 'software', 'hardware', 'interfaz', 'compilador',
    'runtime', 'frontend', 'backend', 'devops', 'cloud',
    'tcp', 'dns', 'vpn', 'gateway', 'routing',
    'nosql', 'mongodb', 'postgresql', 'índice', 'query',
    'normalización', 'transacción', 'replicación', 'sharding',
    'optimización', 'implementación', 'integración', 'iteración',
    'prototipo', 'testing', 'deploy', 'pipeline', 'sprint',
    'requisito', 'especificación', 'abstracción', 'encapsulamiento',
    'herencia', 'polimorfismo', 'recursión', 'concurrencia',
    'token', 'hash', 'middleware', 'websocket', 'graphql',
    'refactoring', 'debugging', 'caché', 'code review',
  ];
  const lower = text.toLowerCase();
  const foundTerms = techTerms.filter((t) => lower.includes(t));

  // Connectors found
  const connectors = [
    'además', 'también', 'asimismo', 'sin embargo', 'no obstante', 'aunque',
    'por lo tanto', 'en consecuencia', 'porque', 'ya que', 'debido a',
    'primero', 'segundo', 'finalmente', 'en conclusión', 'por ejemplo',
    'es decir', 'en primer lugar', 'a continuación', 'por otra parte',
    'dado que', 'en resumen', 'en cambio', 'mientras que', 'cabe destacar',
  ];
  const connectorsFound = connectors.filter((c) => lower.includes(c));

  // Lexical diversity (unique/total ratio)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const uniqueRatio = wordCount > 0 ? Math.round((uniqueWords.size / wordCount) * 100) : 0;

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    paragraphCount: paragraphs.length,
    techTerms: foundTerms,
    techCount: foundTerms.length,
    connectorsFound,
    connectorsCount: connectorsFound.length,
    uniqueRatio,
    words, // actual word list for display
  };
}

export function WrittenCommunicationPage() {
  const { refreshUser } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [selectedEx, setSelectedEx] = useState<any>(null);
  const [phase, setPhase] = useState<'list' | 'write' | 'result'>('list');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultFeedback, setResultFeedback] = useState<any>(null);

  useEffect(() => {
    api.modules.get('written').then((data: any) => {
      setExercises(data.exercises || []);
    }).catch(console.error).finally(() => setLoadingExercises(false));
  }, []);

  const s = useMemo(() => analyzeText(text), [text]);

  const handleSubmit = async () => {
    if (!selectedEx || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.results.submitWritten(selectedEx.id, text);
      const evaluation = response.evaluation || {};
      setResultFeedback({
        overallScore: evaluation.score ?? response.result?.score ?? 0,
        breakdown: evaluation.criteriaScores?.map((c: any) => ({
          id: c.criterionId, label: c.label, weight: c.weight, score: c.score, feedback: c.feedback || '', level: c.level || '',
        })) || [],
        issues: evaluation.issues?.map((issue: any) => ({ type: issue.type, text: issue.message || issue.text })) || [],
        suggestions: evaluation.recommendations || evaluation.editingSuggestions || [],
        editingSuggestions: evaluation.editingSuggestions || [],
        nlpDetails: evaluation.nlpDetails || null,
        synthesisAnalysis: evaluation.synthesisAnalysis || null,
        cohesionAnalysis: evaluation.cohesionAnalysis || null,
      });
      refreshUser();
    } catch {
      setResultFeedback({
        overallScore: 0,
        breakdown: [],
        issues: [{ type: 'warning' as const, text: 'Error al enviar. Por favor intenta de nuevo.' }],
        suggestions: [],
        editingSuggestions: [],
        nlpDetails: null,
        synthesisAnalysis: null,
        cohesionAnalysis: null,
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setPhase('result');
    }
  };

  const wordLimit = selectedEx ? { min: selectedEx.wordLimitMin ?? 0, max: selectedEx.wordLimitMax ?? 9999 } : null;
  const wordStatus = wordLimit
    ? s.wordCount < wordLimit.min ? 'under' : s.wordCount > wordLimit.max ? 'over' : 'ok'
    : 'ok';

  if (phase === 'list') {
    if (loadingExercises) {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando ejercicios...</div></div>;
    }
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/app" className="hover:text-blue-600">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/app/modules" className="hover:text-blue-600">Módulos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Comunicación Escrita</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Comunicación Escrita Técnica</h1>
              <p className="text-slate-500 text-xs">Redacción y síntesis con feedback automático</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto space-y-5">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-cyan-50 text-cyan-700 text-xs font-medium px-2.5 py-1 rounded-full">{ex.subType || ex.exerciseType || 'Escrito'}</span>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{ex.difficulty}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />{ex.timeLimit} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />{ex.wordLimitMin ?? 0}–{ex.wordLimitMax ?? '∞'} palabras
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{(ex.instructions || ex.description || '').split('\n')[0]}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedEx(ex); setText(''); setPhase('write'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Comenzar ejercicio <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'write' && selectedEx) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <button onClick={() => setPhase('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-1">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="font-bold text-slate-900">{selectedEx.title}</h1>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Left: source + instructions */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-cyan-700 font-bold mb-3 text-sm">
                <Target className="w-4 h-4" />
                Indicaciones
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedEx.instructions}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3 text-sm">
                <BookOpen className="w-4 h-4" />
                Texto fuente
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">{selectedEx.sourceText}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-amber-600 font-bold mb-3 text-sm">
                <Lightbulb className="w-4 h-4" />
                Criterios (peso)
              </div>
              {selectedEx.criteria.map((c) => (
                <div key={c.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{c.label}</span>
                  <span className="text-sm font-bold text-cyan-600">{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Tu redacción</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    wordStatus === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                    wordStatus === 'under' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {s.wordCount} palabras {wordLimit && `(mín. ${wordLimit.min}, máx. ${wordLimit.max})`}
                  </span>
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={selectedEx.placeholder || 'Escribe tu redacción aquí...'}
                className="w-full h-64 p-5 text-slate-700 text-sm leading-relaxed resize-none focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Palabras', value: s.wordCount, icon: BookOpen },
                { label: 'Oraciones', value: s.sentenceCount, icon: FileText },
                { label: 'Párrafos', value: s.paragraphCount, icon: Hash },
                { label: 'Prom/oración', value: s.avgWordsPerSentence, icon: BarChart3 },
                { label: 'Técnicos', value: s.techCount, icon: Target },
                { label: 'Conectores', value: s.connectorsCount, icon: TrendingUp },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                    <Icon className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                    <div className="text-xl font-extrabold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Detected technical terms */}
            {s.techTerms.length > 0 && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3">
                <div className="text-xs font-medium text-cyan-700 mb-2">Términos técnicos detectados ({s.techCount}):</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.techTerms.map((term, i) => (
                    <span key={i} className="bg-white text-cyan-700 text-xs px-2 py-0.5 rounded-full border border-cyan-200">{term}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Detected connectors */}
            {s.connectorsFound.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="text-xs font-medium text-blue-700 mb-2">Conectores discursivos ({s.connectorsCount}):</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.connectorsFound.map((c, i) => (
                    <span key={i} className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Diversity indicator */}
            {s.wordCount >= 10 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Diversidad léxica: <strong className={s.uniqueRatio >= 60 ? 'text-emerald-600' : s.uniqueRatio >= 40 ? 'text-amber-600' : 'text-red-600'}>{s.uniqueRatio}%</strong> palabras únicas</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={s.wordCount < (wordLimit?.min || 1) || submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-lg shadow-cyan-200"
            >
              <TrendingUp className="w-5 h-5" />
              {submitting ? 'Evaluando...' : 'Enviar para evaluación'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && selectedEx && resultFeedback) {
    const nlp = resultFeedback.nlpDetails;
    const scoreColor = (score: number) =>
      score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-blue-600' : score >= 55 ? 'text-amber-600' : 'text-red-600';
    const barColor = (score: number) =>
      score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="font-bold text-slate-900">Resultados — {selectedEx.title}</h1>
        </div>
        <div className="px-8 py-6 max-w-4xl mx-auto space-y-5">
          {/* Score */}
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-900 rounded-2xl p-7 text-white text-center">
            <div className="text-6xl font-extrabold mb-2">{resultFeedback.overallScore}</div>
            <div className="text-cyan-200 mb-4">puntuación general</div>
            <div className="flex justify-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(resultFeedback.overallScore / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-cyan-400'}`} />
              ))}
            </div>
          </div>

          {/* NLP Analysis Panel */}
          {nlp && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3 text-sm">
                <BarChart3 className="w-4 h-4" />
                Análisis NLP del texto
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.wordCount}</div>
                  <div className="text-xs text-slate-500">Palabras</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.sentenceCount}</div>
                  <div className="text-xs text-slate-500">Oraciones</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.techTermCount}</div>
                  <div className="text-xs text-slate-500">Términos técnicos</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.connectorsCount}</div>
                  <div className="text-xs text-slate-500">Conectores</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.guiraudIndex}</div>
                  <div className="text-xs text-slate-500">Índice Guiraud</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.fernandezHuerta}</div>
                  <div className="text-xs text-slate-500">Fernández-Huerta</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.lexicalDensity}%</div>
                  <div className="text-xs text-slate-500">Densidad léxica</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.complexityLevel}</div>
                  <div className="text-xs text-slate-500">Complejidad</div>
                </div>
              </div>
              {nlp.techTermsFound && nlp.techTermsFound.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-blue-600 font-medium mb-1">Términos técnicos detectados (NLP):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {nlp.techTermsFound.map((term: string, i: number) => (
                      <span key={i} className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{term}</span>
                    ))}
                  </div>
                </div>
              )}
              {nlp.connectorsUsed && nlp.connectorsUsed.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-blue-600 font-medium mb-1">Conectores detectados:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {nlp.connectorsUsed.map((c: string, i: number) => (
                      <span key={i} className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {nlp.redundancyIndex != null && (
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className={`px-2 py-1 rounded-full ${nlp.redundancyIndex < 0.5 ? 'bg-emerald-100 text-emerald-700' : nlp.redundancyIndex < 1 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    Redundancia: {nlp.redundancyIndex}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    Densidad conceptual: {nlp.conceptDensity}/100 palabras
                  </span>
                  {nlp.lengthPenaltyApplied && (
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      ⚠ Texto corto — penalización aplicada
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Breakdown with feedback */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Por criterio</h3>
              {resultFeedback.breakdown.map((c: any) => (
                <div key={c.id} className="mb-5">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{c.label}</span>
                    <span className={`text-sm font-bold ${scoreColor(c.score)}`}>{c.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5">
                    <div
                      className={`h-2 rounded-full ${barColor(c.score)} transition-all`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  {c.feedback && (
                    <p className="text-xs text-slate-500 leading-relaxed">{c.feedback}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Feedback issues */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Feedback detallado</h3>
              <div className="space-y-3">
                {resultFeedback.issues.map((issue: any, i: number) => {
                  const config: Record<string, any> = {
                    warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
                    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
                    info: { icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
                    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
                  };
                  const c = config[issue.type] || config.info;
                  const Icon = c.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.color}`} />
                      <p className="text-sm text-slate-700">{issue.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Editing suggestions */}
              {(resultFeedback.editingSuggestions || []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-700 mb-3">Sugerencias de edición</div>
                  {resultFeedback.editingSuggestions.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                      <span className="w-5 h-5 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {(resultFeedback.suggestions || []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-700 mb-3">Recomendaciones</div>
                  {resultFeedback.suggestions.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Your text */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Tu redacción ({s.wordCount} palabras)</h3>
              <button onClick={() => setPhase('write')} className="flex items-center gap-1.5 text-cyan-600 text-sm hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{text || '(Sin texto ingresado)'}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPhase('write'); setText(''); }} className="flex-1 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              <RefreshCw className="w-4 h-4 inline mr-1" /> Reintentar
            </button>
            <button onClick={() => setPhase('list')} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              Siguiente ejercicio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}