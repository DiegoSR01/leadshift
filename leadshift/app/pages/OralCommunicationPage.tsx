import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import {
  Mic, ChevronRight, ChevronLeft, Play, Pause, Square,
  CheckCircle, Clock, RotateCcw, ArrowRight, Star,
  Volume2, List, Target, Award, BookOpen, AlertCircle,
  MicOff, Wifi, WifiOff,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const scoreColors = (score: number) => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-red-600';
};

export function OralCommunicationPage() {
  const { refreshUser } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [phase, setPhase] = useState<'select' | 'prep' | 'record' | 'result'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selfEval, setSelfEval] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [whisperAvailable, setWhisperAvailable] = useState(false);
  // Real-time feedback state
  const [micStatus, setMicStatus] = useState<'idle' | 'active' | 'denied' | 'unavailable'>('idle');
  const [sttStatus, setSttStatus] = useState<'idle' | 'listening' | 'recognized' | 'error'>('idle');
  const [sttError, setSttError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    api.modules.get('oral').then((data: any) => {
      setExercises(data.exercises || []);
    }).catch(console.error).finally(() => setLoadingExercises(false));

    // Check Whisper availability
    api.transcribe.status()
      .then((s) => setWhisperAvailable(s.available))
      .catch(() => setWhisperAvailable(false));
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRecording(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording, isPaused]);

  // Audio level monitor using Web Audio API AnalyserNode
  const startAudioLevelMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let voiceFrames = 0;

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        // RMS of frequency bins → normalized 0–100
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, Math.round((rms / 128) * 100));
        setAudioLevel(level);
        // Voice threshold: if level > 8 for a few frames, voice is detected
        if (level > 8) {
          voiceFrames = Math.min(voiceFrames + 1, 10);
        } else {
          voiceFrames = Math.max(voiceFrames - 1, 0);
        }
        setVoiceDetected(voiceFrames >= 3);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Web Audio API not available — skip level monitor
    }
  }, []);

  const stopAudioLevelMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setVoiceDetected(false);
  }, []);

  const startRecording = () => {
    if (!selectedExercise) return;
    setTimeLeft(selectedExercise.duration * 60);
    setElapsed(0);
    setIsRecording(true);
    setIsPaused(false);
    setTranscript('');
    setInterimText('');
    audioChunksRef.current = [];
    setMicStatus('idle');
    setSttStatus('idle');
    setSttError('');

    // Start MediaRecorder + audio level monitor
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      streamRef.current = stream;
      setMicStatus('active');

      // Audio level visualization
      startAudioLevelMonitor(stream);

      // MediaRecorder for Whisper fallback
      try {
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.start(1000);
        mediaRecorderRef.current = mr;
      } catch {
        // MediaRecorder not available — still have Web Speech API
      }
    }).catch((err) => {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('denied');
        setSttError('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
      } else {
        setMicStatus('unavailable');
        setSttError('No se detectó micrófono. Conecta uno e intenta de nuevo.');
      }
    });

    // Start Web Speech API recognition with interim results
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = true;
      recognition.interimResults = true; // Show text as user speaks
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setSttStatus('listening');
      };
      recognition.onresult = (event: any) => {
        let finalPart = '';
        let interimPart = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalPart += text + ' ';
            setSttStatus('recognized');
          } else {
            interimPart += text;
          }
        }
        if (finalPart) {
          setTranscript((prev) => prev + finalPart);
          setInterimText('');
        }
        if (interimPart) {
          setInterimText(interimPart);
          setSttStatus('recognized');
        }
      };
      recognition.onerror = (event: any) => {
        const code = event.error;
        if (code === 'no-speech') {
          // Brief silence — not a real error, keep listening
          return;
        }
        if (code === 'network') {
          setSttError('Error de red. El reconocimiento de voz requiere conexión a internet (Google Chrome).');
          setSttStatus('error');
        } else if (code === 'not-allowed') {
          setSttError('Permiso de micrófono denegado para reconocimiento de voz.');
          setSttStatus('error');
          setMicStatus('denied');
        } else if (code === 'aborted') {
          // User or system abort — ignore
        } else {
          setSttError(`Error STT: ${code}`);
          setSttStatus('error');
        }
      };
      recognition.onend = () => {
        // Auto-restart if still recording and no fatal error
        if (recognitionRef.current && sttStatus !== 'error') {
          try { recognitionRef.current.start(); } catch {}
        }
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setSttStatus('error');
        setSttError('No se pudo iniciar el reconocimiento de voz. Usa Google Chrome.');
      }
    } else {
      setSttStatus('error');
      setSttError('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // Stop all tracks and audio monitor
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopAudioLevelMonitor();
    setSttStatus('idle');
    setMicStatus('idle');
    setInterimText('');

    // Try Whisper transcription first, then fall back to Web Speech API transcript
    let finalTranscript = transcript;
    if (whisperAvailable && audioChunksRef.current.length > 0) {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const whisperResult = await api.transcribe.audio(audioBlob);
        if (whisperResult.text && whisperResult.text.trim().length > 0) {
          finalTranscript = whisperResult.text;
        }
      } catch {
        // Fall back to Web Speech API transcript
      }
    }

    // If no real transcript was captured, show error instead of submitting generic text
    if (!finalTranscript || finalTranscript.trim().length < 5) {
      setResultData({
        total: 0,
        breakdown: [],
        recommendations: [
          'No se detectó audio con contenido suficiente. Verifica que tu micrófono esté habilitado y que el navegador tenga permisos de audio.',
          'Usa Google Chrome para mejor compatibilidad con el reconocimiento de voz.',
          'Habla de forma clara y a un volumen adecuado durante la presentación.',
        ],
        strengths: [],
        transcript: '',
        nlpDetails: null,
        noTranscript: true,
      });
      setSubmitting(false);
      setPhase('result');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.results.submitOral(selectedExercise.id, finalTranscript);
      const evaluation = response.evaluation || {};
      setResultData({
        total: evaluation.score ?? response.result?.score ?? 0,
        breakdown: evaluation.criteriaScores?.map((c: any) => ({ label: c.label, weight: c.weight, score: c.score, description: c.feedback || '' })) || [],
        recommendations: evaluation.recommendations || [],
        strengths: evaluation.strengths || [],
        transcript: finalTranscript,
        nlpDetails: evaluation.nlpDetails || null,
      });
      refreshUser();
    } catch {
      setResultData({
        total: 0,
        breakdown: [],
        recommendations: ['Error al enviar la evaluación. Intenta de nuevo.'],
        strengths: [],
        transcript: finalTranscript,
        nlpDetails: null,
      });
    } finally {
      setSubmitting(false);
      setPhase('result');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectExercise = (ex: any) => {
    setSelectedExercise(ex);
    setPhase('prep');
    setSelfEval({});
    setElapsed(0);
    setResultData(null);
  };

  if (loadingExercises) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Cargando ejercicios...</div></div>;
  }

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/app/modules" className="hover:text-blue-600 transition-colors">Módulos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Comunicación Oral</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontSize: '1.2rem' }}>Comunicación Oral Técnica</h1>
              <p className="text-slate-500 text-xs">Ejercicios de presentación con evaluación estructurada</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto">
          <div className="grid gap-5">
            {exercises.map((ex) => (
              <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">{ex.subType || ex.exerciseType || 'Oral'}</span>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{ex.difficulty}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {ex.duration} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{ex.description || ''}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5" />
                      {(ex.criteria || []).length} criterios
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      {(ex.tips || []).length} consejos
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectExercise(ex)}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    Iniciar ejercicio
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'prep' && selectedExercise) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <button onClick={() => setPhase('select')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-1">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="font-bold text-slate-900">{selectedExercise.title}</h1>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Prompt */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 text-violet-700 font-bold mb-4">
              <BookOpen className="w-5 h-5" />
              Indicaciones del ejercicio
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{selectedExercise.prompt || selectedExercise.description || ''}</pre>
          </div>

          {/* Tips + Criteria */}
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-3">
                <AlertCircle className="w-5 h-5" />
                Consejos clave
              </div>
              <ul className="space-y-2">
                {(selectedExercise.tips || []).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 font-bold mb-3">
                <Target className="w-5 h-5 text-violet-500" />
                Criterios de evaluación
              </div>
              <div className="space-y-3">
                {(selectedExercise.criteria || []).map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700">{c.label}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </div>
                    <span className="text-sm font-bold text-violet-600 ml-3">{c.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { startRecording(); setPhase('record'); }}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-200 text-sm"
            >
              <Mic className="w-5 h-5" />
              Comenzar presentación ({selectedExercise.duration} min)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'record' && selectedExercise) {
    const progress = (elapsed / (selectedExercise.duration * 60)) * 100;
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <div className="text-slate-400 text-sm mb-2">{selectedExercise.title}</div>
          <h2 className="text-white text-2xl font-bold">Estás presentando</h2>
        </div>

        {/* Big timer */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeLeft < 30 ? '#ef4444' : timeLeft < 60 ? '#f59e0b' : '#8b5cf6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-extrabold ${timeLeft < 30 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-slate-400 text-sm mt-1">restante</div>
          </div>
        </div>

        {/* ── Status bar: mic + STT + voice ── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
          {/* Mic status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            micStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
            micStatus === 'denied' ? 'bg-red-500/20 text-red-400' :
            micStatus === 'unavailable' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {micStatus === 'active' ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {micStatus === 'active' ? 'Micrófono activo' :
             micStatus === 'denied' ? 'Micrófono denegado' :
             micStatus === 'unavailable' ? 'Sin micrófono' : 'Conectando...'}
          </div>

          {/* Voice detection */}
          {micStatus === 'active' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              voiceDetected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
            }`}>
              <Volume2 className={`w-3.5 h-3.5 ${voiceDetected ? 'animate-pulse' : ''}`} />
              {voiceDetected ? 'Voz detectada' : 'Esperando voz...'}
            </div>
          )}

          {/* STT status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            sttStatus === 'recognized' ? 'bg-emerald-500/20 text-emerald-400' :
            sttStatus === 'listening' ? 'bg-blue-500/20 text-blue-400' :
            sttStatus === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {sttStatus === 'error' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {sttStatus === 'recognized' ? 'Texto capturado' :
             sttStatus === 'listening' ? 'Escuchando...' :
             sttStatus === 'error' ? 'Error STT' : 'Iniciando STT...'}
          </div>
        </div>

        {/* Audio level meter */}
        {micStatus === 'active' && isRecording && !isPaused && (
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center gap-2">
              <Mic className={`w-4 h-4 flex-shrink-0 ${voiceDetected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    audioLevel > 50 ? 'bg-emerald-400' : audioLevel > 20 ? 'bg-blue-400' : audioLevel > 8 ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.max(2, audioLevel)}%` }}
                />
              </div>
              <span className="text-slate-500 text-xs w-8 text-right">{audioLevel}%</span>
            </div>
          </div>
        )}

        {/* STT Error message */}
        {sttError && (
          <div className="w-full max-w-lg bg-red-500/15 border border-red-500/30 rounded-xl p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {sttError}
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && !isPaused && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-5 py-2.5 rounded-full mb-4 animate-pulse">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Presentando — {formatTime(elapsed)} transcurrido</span>
          </div>
        )}

        {/* Live transcript + interim text */}
        {(transcript || interimText) ? (
          <div className="w-full max-w-lg bg-white/10 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-xs">Transcripción en vivo:</div>
              <div className="text-slate-500 text-xs">{transcript.split(/\s+/).filter(Boolean).length} palabras</div>
            </div>
            <p className="text-white text-sm leading-relaxed">
              {transcript}
              {interimText && <span className="text-violet-300 italic">{interimText}</span>}
            </p>
          </div>
        ) : (
          micStatus === 'active' && sttStatus !== 'error' && (
            <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-center">
              <p className="text-slate-500 text-sm">
                {voiceDetected ? 'Procesando tu voz...' : 'Comienza a hablar. Tu discurso aparecerá aquí en tiempo real.'}
              </p>
            </div>
          )
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-colors"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          <button
            onClick={stopRecording}
            className="w-16 h-16 bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-900/50 hover:opacity-90 transition-opacity"
          >
            <Square className="w-7 h-7" />
          </button>
          <button
            onClick={() => { setIsRecording(false); if (intervalRef.current) clearInterval(intervalRef.current); if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); recognitionRef.current = null; } if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } stopAudioLevelMonitor(); setTranscript(''); setInterimText(''); setSttError(''); startRecording(); }}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6 mt-8 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pausar</div>
          <div className="flex items-center gap-1.5"><Square className="w-3.5 h-3.5" /> Finalizar</div>
          <div className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reiniciar</div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && selectedExercise && resultData) {
    const nlp = resultData.nlpDetails;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="font-bold text-slate-900">Resultados — {selectedExercise.title}</h1>
        </div>
        <div className="px-8 py-6 max-w-3xl mx-auto space-y-5">

          {/* No transcript warning */}
          {resultData.noTranscript && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-bold text-red-800 text-lg mb-2">No se detectó transcripción</h3>
              <p className="text-red-700 text-sm mb-4">El sistema no pudo capturar tu voz. Verifica tu micrófono y los permisos del navegador.</p>
              <button onClick={() => { setPhase('prep'); setElapsed(0); setTranscript(''); }} className="bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
                Reintentar presentación
              </button>
            </div>
          )}

          {/* Score hero — only if we have a real evaluation */}
          {!resultData.noTranscript && (
            <div className="bg-gradient-to-r from-violet-600 to-violet-900 rounded-2xl p-7 text-center text-white">
              <div className="text-6xl font-extrabold mb-2">{resultData.total}</div>
              <div className="text-violet-200 mb-4">puntos sobre 100</div>
              <div className="flex items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < Math.round(resultData.total / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-violet-400'}`} />
                ))}
              </div>
            </div>
          )}

          {/* NLP Analysis Details */}
          {nlp && !resultData.noTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                <Volume2 className="w-5 h-5" />
                Análisis NLP del discurso
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
                  <div className="text-2xl font-bold text-slate-900">{nlp.uniqueWordRatio}%</div>
                  <div className="text-xs text-slate-500">Diversidad léxica</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{nlp.complexityLevel}</div>
                  <div className="text-xs text-slate-500">Complejidad</div>
                </div>
              </div>
              {/* Structure indicators */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className={`px-2 py-1 rounded-full ${nlp.hasIntroduction ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {nlp.hasIntroduction ? '✓' : '✗'} Introducción
                </span>
                <span className={`px-2 py-1 rounded-full ${nlp.hasConclusion ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {nlp.hasConclusion ? '✓' : '✗'} Conclusión
                </span>
                {nlp.lengthPenaltyApplied && (
                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    ⚠ Texto corto — penalización aplicada
                  </span>
                )}
              </div>
              {/* Technical terms found */}
              {nlp.techTermsFound && nlp.techTermsFound.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-blue-600 font-medium mb-1">Términos técnicos detectados:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {nlp.techTermsFound.map((term: string, i: number) => (
                      <span key={i} className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{term}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Breakdown */}
          {resultData.breakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Detalle por criterio</h3>
              <div className="space-y-4">
                {resultData.breakdown.map((c: any) => (
                  <div key={c.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{c.label}</span>
                      <span className={`text-sm font-bold ${scoreColors(c.score)}`}>{c.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${c.score >= 85 ? 'bg-emerald-500' : c.score >= 70 ? 'bg-blue-500' : c.score >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{c.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {(resultData.strengths || []).length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                <CheckCircle className="w-5 h-5" />
                Fortalezas identificadas
              </div>
              <ul className="space-y-2">
                {resultData.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-emerald-800 text-sm">
                    <Star className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {(resultData.recommendations || []).length > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-violet-700 font-bold mb-3">
                <Award className="w-5 h-5" />
                Recomendaciones personalizadas
              </div>
              <ul className="space-y-2.5">
                {resultData.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-violet-800 text-sm">
                    <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript */}
          {resultData.transcript && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-3">Tu transcripción</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{resultData.transcript}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setPhase('prep'); setElapsed(0); setTranscript(''); }} className="flex-1 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              Repetir ejercicio
            </button>
            <button onClick={() => setPhase('select')} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-800 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              Siguiente ejercicio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
