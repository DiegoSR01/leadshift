import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronRight, Download, FileText, Users, BarChart3, TrendingUp,
  Search, FileSpreadsheet, Shield, RefreshCw, ArrowUpRight,
  ArrowDownRight, Minus, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function variationIcon(pct: number) {
  if (pct > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-500 inline" />;
  if (pct < 0) return <ArrowDownRight className="w-4 h-4 text-red-400 inline" />;
  return <Minus className="w-4 h-4 text-slate-400 inline" />;
}

function variationColor(pct: number) {
  if (pct > 0) return 'text-emerald-600 bg-emerald-50';
  if (pct < 0) return 'text-red-500 bg-red-50';
  return 'text-slate-500 bg-slate-100';
}

function scoreColor(score: number | null) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 85) return 'text-emerald-600 font-semibold';
  if (score >= 70) return 'text-blue-600 font-semibold';
  if (score >= 55) return 'text-amber-600 font-semibold';
  return 'text-red-500 font-semibold';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string;
  name: string;
  email: string;
  career: string;
  semester: number;
  pretestScore: number | null;
  postestScore: number | null;
  variationPct: number | null;
  modulesCompleted: number;
  totalModules: number;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  avgScore: number;
  usersWithPretest: number;
  usersWithPostest: number;
  avgImprovement: number;
  completionRate: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Per-button loading states
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

  // Guard: only admin users can access this page
  if (user && user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        api.admin.stats(),
        api.admin.users.list(),
      ]);
      setStats(statsData);
      setStudents(usersData);
    } catch (err) {
      console.error('[AdminReports] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleDownloadCsv = async () => {
    setCsvLoading(true);
    try {
      await api.admin.reports.downloadCsv();
    } catch (err: any) {
      alert(`Error al generar CSV: ${err.message}`);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDownloadPdf = async (student: StudentRow) => {
    setPdfLoading((prev) => ({ ...prev, [student.id]: true }));
    try {
      await api.admin.reports.downloadPdf(student.id, student.name);
    } catch (err: any) {
      alert(`Error al generar PDF: ${err.message}`);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.career || '').toLowerCase().includes(q)
    );
  });

  const chartData = filteredStudents
    .filter((s) => s.pretestScore !== null || s.postestScore !== null)
    .slice(0, 10)
    .map((s) => ({
      name: s.name.split(' ')[0],
      Pretest: s.pretestScore ?? 0,
      Postest: s.postestScore ?? 0,
    }));

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-slate-400 text-sm">Cargando panel de administración…</span>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/app" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Panel de Administración</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Panel de Administración</h1>
              <p className="text-slate-500 text-sm">Módulo de Reportes · LeadShift</p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar datos
          </button>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-7xl">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Alumnos registrados"
            value={stats?.totalUsers ?? 0}
            icon={<Users className="w-5 h-5 text-blue-500" />}
            bg="bg-blue-50"
          />
          <KpiCard
            label="Promedio general"
            value={`${(stats?.avgScore ?? 0).toFixed(1)}%`}
            icon={<BarChart3 className="w-5 h-5 text-violet-500" />}
            bg="bg-violet-50"
          />
          <KpiCard
            label="Con Pretest"
            value={stats?.usersWithPretest ?? 0}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-50"
          />
          <KpiCard
            label="Con Postest"
            value={stats?.usersWithPostest ?? 0}
            icon={<CheckCircle2 className="w-5 h-5 text-cyan-500" />}
            bg="bg-cyan-50"
          />
          <KpiCard
            label="Mejora promedio"
            value={`+${(stats?.avgImprovement ?? 0).toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
            bg="bg-amber-50"
          />
          <KpiCard
            label="Tasa de completitud"
            value={`${(stats?.completionRate ?? 0).toFixed(0)}%`}
            icon={<BarChart3 className="w-5 h-5 text-rose-500" />}
            bg="bg-rose-50"
          />
        </div>

        {/* ── Export Section ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* CSV Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Exportar CSV · Datos Grupales</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Archivo de datos crudos compatible con Excel, SPSS y herramientas estadísticas.
                  Incluye ID, nombre, puntajes de Pretest / Postest, puntajes por módulo y marcas de tiempo.
                </p>
              </div>
            </div>
            <ul className="text-xs text-slate-500 space-y-1 pl-1">
              <li>• Todos los alumnos del grupo ({stats?.totalUsers ?? 0} registros)</li>
              <li>• Puntajes de Liderazgo, Com. Oral y Com. Escrita</li>
              <li>• Variación porcentual Pretest → Postest calculada automáticamente</li>
            </ul>
            <button
              onClick={handleDownloadCsv}
              disabled={csvLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              {csvLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {csvLoading ? 'Generando…' : 'Descargar CSV Grupal'}
            </button>
          </div>

          {/* PDF Group Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Informes PDF Individuales</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Reportes visuales por alumno con gráficas de radar, progreso histórico y retroalimentación
                  cualitativa generada por IA. Útil para expedientes y entrega académica.
                </p>
              </div>
            </div>
            <ul className="text-xs text-slate-500 space-y-1 pl-1">
              <li>• Gráfica radar de habilidades blandas</li>
              <li>• Comparativa Pretest vs Postest</li>
              <li>• Feedback generado por el motor de IA</li>
            </ul>
            <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm">
              <FileText className="w-4 h-4 flex-shrink-0" />
              Usa el botón <strong className="mx-1">Descargar PDF</strong> por cada alumno en la tabla inferior.
            </div>
          </div>
        </div>

        {/* ── Pretest vs Postest Chart ── */}
        {chartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-1">Comparativa Grupal · Pretest vs Postest</h2>
            <p className="text-slate-500 text-xs mb-4">Primeros {chartData.length} alumnos con evaluaciones registradas</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                />
                <Bar dataKey="Pretest" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Postest" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-end">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />Pretest</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />Postest</span>
            </div>
          </div>
        )}

        {/* ── Student Table ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Directorio de Alumnos</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {filteredStudents.length} de {students.length} alumnos
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o carrera…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-72"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Alumno</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Carrera · Sem.</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Pretest</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Postest</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Variación</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Módulos</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                      {searchQuery ? 'No se encontraron alumnos con ese criterio.' : 'No hay alumnos registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const variation = student.variationPct;
                    const hasPretest = student.pretestScore !== null;
                    const hasPostest = student.postestScore !== null;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name + email */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                {student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{student.name}</div>
                              <div className="text-slate-400 text-xs">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Career */}
                        <td className="px-4 py-3.5">
                          <div className="text-slate-700">{student.career || '—'}</div>
                          <div className="text-slate-400 text-xs">Sem. {student.semester ?? '—'}</div>
                        </td>

                        {/* Pretest */}
                        <td className="px-4 py-3.5 text-center">
                          {hasPretest ? (
                            <span className={scoreColor(student.pretestScore)}>
                              {student.pretestScore!.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Pendiente
                            </span>
                          )}
                        </td>

                        {/* Postest */}
                        <td className="px-4 py-3.5 text-center">
                          {hasPostest ? (
                            <span className={scoreColor(student.postestScore)}>
                              {student.postestScore!.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Pendiente
                            </span>
                          )}
                        </td>

                        {/* Variation */}
                        <td className="px-4 py-3.5 text-center">
                          {variation !== null ? (
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${variationColor(variation)}`}>
                              {variationIcon(variation)}
                              {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Modules */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full"
                                style={{
                                  width: `${student.totalModules > 0
                                    ? Math.min(100, (student.modulesCompleted / student.totalModules) * 100)
                                    : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-slate-500 text-xs">{student.modulesCompleted}/{student.totalModules}</span>
                          </div>
                        </td>

                        {/* PDF Action */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleDownloadPdf(student)}
                            disabled={pdfLoading[student.id]}
                            title={`Descargar reporte PDF de ${student.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                          >
                            {pdfLoading[student.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            {pdfLoading[student.id] ? 'Generando…' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          {students.length > 0 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>Los reportes se generan en tiempo real a partir de la base de datos.</span>
              <span>{new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── KPI Card sub-component ──────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
}

function KpiCard({ label, value, icon, bg }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
        <div className="text-slate-500 text-xs mt-1 leading-snug">{label}</div>
      </div>
    </div>
  );
}
