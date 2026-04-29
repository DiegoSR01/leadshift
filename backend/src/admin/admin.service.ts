import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import PDFDocument = require('pdfkit');
import { User } from '../entities/user.entity';
import { Assessment } from '../entities/assessment.entity';
import { Result } from '../entities/result.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Module as ModuleEntity } from '../entities/module.entity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape a CSV cell value per RFC 4180 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a single CSV row */
function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(',');
}

/** Average of a Record<string, number> values */
function avgScores(scores: Record<string, number> | null | undefined): number {
  if (!scores) return 0;
  const vals = Object.values(scores);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

/** Percentage variation between two values */
function variation(before: number, after: number): number | null {
  if (before === 0) return null;
  return Math.round(((after - before) / before) * 1000) / 10;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Assessment) private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Result) private readonly resultRepo: Repository<Result>,
    @InjectRepository(UserProgress) private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(ModuleEntity) private readonly moduleRepo: Repository<ModuleEntity>,
  ) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    const [users, assessments, progressRows, modules] = await Promise.all([
      this.userRepo.find(),
      this.assessmentRepo.find(),
      this.progressRepo.find(),
      this.moduleRepo.find(),
    ]);

    const totalUsers = users.length;
    const totalModules = modules.filter((m) => !m.locked).length;

    // Users who submitted a pretest / postest
    const usersWithPretest = new Set(
      assessments.filter((a) => a.type === 'pretest').map((a) => a.userId),
    ).size;
    const usersWithPostest = new Set(
      assessments.filter((a) => a.type === 'postest').map((a) => a.userId),
    ).size;

    // Average improvement for users who have both
    let totalImprovement = 0;
    let improvementCount = 0;
    for (const userId of assessments
      .filter((a) => a.type === 'postest')
      .map((a) => a.userId)) {
      const pre = assessments.find((a) => a.userId === userId && a.type === 'pretest');
      const pos = assessments.find((a) => a.userId === userId && a.type === 'postest');
      if (pre && pos) {
        const before = avgScores(pre.scores);
        const after = avgScores(pos.scores);
        if (before > 0) {
          totalImprovement += ((after - before) / before) * 100;
          improvementCount++;
        }
      }
    }
    const avgImprovement =
      improvementCount > 0
        ? Math.round((totalImprovement / improvementCount) * 10) / 10
        : 0;

    // Overall avg score from progress
    const allAvgs = progressRows.map((p) => p.avgScore).filter((s) => s > 0);
    const avgScore =
      allAvgs.length > 0
        ? Math.round((allAvgs.reduce((s, v) => s + v, 0) / allAvgs.length) * 10) / 10
        : 0;

    // Completion rate: users who completed at least one module / total
    const usersWithCompletedModule = new Set(
      progressRows.filter((p) => p.status === 'Completado').map((p) => p.userId),
    ).size;
    const completionRate =
      totalUsers > 0
        ? Math.round((usersWithCompletedModule / totalUsers) * 1000) / 10
        : 0;

    return {
      totalUsers,
      avgScore,
      usersWithPretest,
      usersWithPostest,
      avgImprovement,
      completionRate,
    };
  }

  // ── User list ──────────────────────────────────────────────────────────────

  async getUserList() {
    const [users, assessments, progressRows, modules] = await Promise.all([
      this.userRepo.find({ order: { createdAt: 'ASC' } }),
      this.assessmentRepo.find(),
      this.progressRepo.find(),
      this.moduleRepo.find({ where: { locked: false } }),
    ]);

    const totalModules = modules.length;

    return users.map((user) => {
      const pre = assessments.find(
        (a) => a.userId === user.id && a.type === 'pretest',
      );
      const pos = assessments.find(
        (a) => a.userId === user.id && a.type === 'postest',
      );
      const pretestScore = pre ? avgScores(pre.scores) : null;
      const postestScore = pos ? avgScores(pos.scores) : null;
      const variationPct =
        pretestScore !== null && postestScore !== null
          ? variation(pretestScore, postestScore)
          : null;

      const userProgress = progressRows.filter((p) => p.userId === user.id);
      const modulesCompleted = userProgress.filter(
        (p) => p.status === 'Completado',
      ).length;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        career: user.career,
        semester: user.semester,
        pretestScore,
        postestScore,
        variationPct,
        modulesCompleted,
        totalModules,
        createdAt: user.createdAt,
      };
    });
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  /**
   * Streams a UTF-8 CSV file to the Express response.
   * BOM prefix ensures Excel opens it correctly.
   */
  async streamCsv(res: Response): Promise<void> {
    const [users, assessments, progressRows, modules] = await Promise.all([
      this.userRepo.find({ order: { createdAt: 'ASC' } }),
      this.assessmentRepo.find(),
      this.progressRepo.find(),
      this.moduleRepo.find({ where: { locked: false } }),
    ]);

    const totalModules = modules.length;
    const filename = `leadshift-grupal-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    // BOM for Excel UTF-8 compatibility
    res.write('\uFEFF');

    // Header row
    const headers = [
      'ID',
      'Nombre',
      'Email',
      'Universidad',
      'Carrera',
      'Semestre',
      'Pretest Promedio (%)',
      'Postest Promedio (%)',
      'Variación (%)',
      'Liderazgo Pretest',
      'Liderazgo Postest',
      'Com. Oral Pretest',
      'Com. Oral Postest',
      'Com. Escrita Pretest',
      'Com. Escrita Postest',
      'Módulos Completados',
      'Módulos Totales',
      'XP Total',
      'Nivel',
      'Racha',
      'Fecha de Registro',
    ];
    res.write(csvRow(headers) + '\r\n');

    for (const user of users) {
      const pre = assessments.find(
        (a) => a.userId === user.id && a.type === 'pretest',
      );
      const pos = assessments.find(
        (a) => a.userId === user.id && a.type === 'postest',
      );

      const pretestAvg = pre ? avgScores(pre.scores) : null;
      const postestAvg = pos ? avgScores(pos.scores) : null;
      const variationPct =
        pretestAvg !== null && postestAvg !== null
          ? variation(pretestAvg, postestAvg)
          : null;

      // Per-skill scores (keys may vary; use consistent keys)
      const skillKey = (scores: Record<string, number> | undefined, key: string) =>
        scores ? (scores[key] ?? '') : '';

      const userProgress = progressRows.filter((p) => p.userId === user.id);
      const modulesCompleted = userProgress.filter(
        (p) => p.status === 'Completado',
      ).length;

      const row = [
        user.id,
        user.name,
        user.email,
        user.university,
        user.career,
        user.semester,
        pretestAvg ?? '',
        postestAvg ?? '',
        variationPct ?? '',
        skillKey(pre?.scores, 'liderazgo'),
        skillKey(pos?.scores, 'liderazgo'),
        skillKey(pre?.scores, 'comOral'),
        skillKey(pos?.scores, 'comOral'),
        skillKey(pre?.scores, 'escritura'),
        skillKey(pos?.scores, 'escritura'),
        modulesCompleted,
        totalModules,
        user.xp,
        user.level,
        user.streak,
        new Date(user.createdAt).toISOString(),
      ];
      res.write(csvRow(row) + '\r\n');
    }

    res.end();
  }

  // ── PDF export ─────────────────────────────────────────────────────────────

  /**
   * Generates and streams a PDF report for a single student.
   */
  async streamPdf(userId: string, res: Response): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Alumno no encontrado');

    const [assessments, results, progressRows, modules] = await Promise.all([
      this.assessmentRepo.find({ where: { userId } }),
      this.resultRepo.find({ where: { userId }, order: { completedAt: 'DESC' } }),
      this.progressRepo.find({ where: { userId } }),
      this.moduleRepo.find({ where: { locked: false } }),
    ]);

    const pre = assessments.find((a) => a.type === 'pretest');
    const pos = assessments.find((a) => a.type === 'postest');
    const pretestAvg = pre ? avgScores(pre.scores) : null;
    const postestAvg = pos ? avgScores(pos.scores) : null;
    const variationPct =
      pretestAvg !== null && postestAvg !== null
        ? variation(pretestAvg, postestAvg)
        : null;

    const filename = `leadshift-reporte-${user.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // ── Build PDF document ──────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    doc.pipe(res);

    const W = doc.page.width - 100; // usable width
    const BLUE = '#2563EB';
    const VIOLET = '#7C3AED';
    const DARK = '#0F172A';
    const SLATE = '#475569';
    const LIGHT = '#F8FAFC';
    const GREEN = '#059669';
    const RED = '#DC2626';

    // ── Header band ─────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);

    doc
      .fillColor('#FFFFFF')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('LeadShift', 50, 22);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#94A3B8')
      .text('Plataforma de Desarrollo de Habilidades Blandas', 50, 48);

    doc
      .fontSize(9)
      .fillColor('#94A3B8')
      .text(`Informe generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 50, 62);

    // Right side: REPORTE INDIVIDUAL label
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#6366F1')
      .text('REPORTE INDIVIDUAL', 350, 32, { width: 195, align: 'right' });

    doc.moveDown(2.5);

    // ── Student card ────────────────────────────────────────────────────────
    const y0 = 100;
    doc.rect(50, y0, W, 70).fill(LIGHT);
    doc.rect(50, y0, 4, 70).fill(BLUE);

    doc
      .fillColor(DARK)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(user.name, 64, y0 + 10, { width: W - 20 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(SLATE)
      .text(user.email, 64, y0 + 30)
      .text(`${user.career} · Semestre ${user.semester} · ${user.university}`, 64, y0 + 44)
      .text(`Nivel ${user.level} · ${user.xp.toLocaleString()} XP · Racha: ${user.streak} días`, 64, y0 + 58);

    doc.y = y0 + 80;

    // ── Assessment comparison ────────────────────────────────────────────────
    doc
      .fillColor(DARK)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Evaluación: Pretest vs Postest', 50, doc.y + 10);

    doc.y += 8;

    if (!pre) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(SLATE)
        .text('Este alumno aún no ha completado el Pretest.', 50, doc.y + 10);
      doc.y += 20;
    } else {
      const skills = Object.keys(pre.scores);
      const tableY = doc.y + 12;
      const col = [50, 180, 280, 380];
      const rowH = 22;

      // Table header
      doc.rect(50, tableY, W, rowH).fill('#E2E8F0');
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold');
      doc.text('Habilidad', col[0] + 6, tableY + 7);
      doc.text('Pretest', col[1] + 6, tableY + 7);
      doc.text('Postest', col[2] + 6, tableY + 7);
      doc.text('Variación', col[3] + 6, tableY + 7);

      skills.forEach((skill, i) => {
        const rowY = tableY + rowH * (i + 1);
        if (i % 2 === 0) doc.rect(50, rowY, W, rowH).fill('#F8FAFC');
        else doc.rect(50, rowY, W, rowH).fill('#FFFFFF');

        const pre_s = pre.scores[skill] ?? 0;
        const pos_s = pos?.scores[skill] ?? null;
        const var_s = pos_s !== null && pre_s > 0
          ? ((pos_s - pre_s) / pre_s) * 100
          : null;

        doc.fillColor(SLATE).fontSize(9).font('Helvetica');
        doc.text(skill, col[0] + 6, rowY + 7);
        doc.text(`${pre_s.toFixed(1)}%`, col[1] + 6, rowY + 7);
        doc.text(pos_s !== null ? `${pos_s.toFixed(1)}%` : '—', col[2] + 6, rowY + 7);

        if (var_s !== null) {
          doc
            .fillColor(var_s >= 0 ? GREEN : RED)
            .text(`${var_s >= 0 ? '+' : ''}${var_s.toFixed(1)}%`, col[3] + 6, rowY + 7);
        } else {
          doc.fillColor(SLATE).text('—', col[3] + 6, rowY + 7);
        }
      });

      doc.y = tableY + rowH * (skills.length + 1) + 8;

      // Summary bar
      doc.rect(50, doc.y, W, 32).fill(DARK);
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text(`Promedio Pretest: ${pretestAvg?.toFixed(1) ?? '—'}%`, 64, doc.y + 4);
      doc.text(
        `Promedio Postest: ${postestAvg?.toFixed(1) ?? '—'}%`,
        64 + 160,
        doc.y + 4,
      );
      if (variationPct !== null) {
        const vColor = variationPct >= 0 ? '#34D399' : '#F87171';
        doc
          .fillColor(vColor)
          .text(
            `Variación: ${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(1)}%`,
            64 + 320,
            doc.y + 4,
          );
      }
      doc.y += 40;
    }

    // ── Module progress ──────────────────────────────────────────────────────
    if (doc.y > 680) doc.addPage();

    doc
      .fillColor(DARK)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Progreso por Módulo', 50, doc.y + 12);
    doc.y += 8;

    if (modules.length === 0) {
      doc.fontSize(9).font('Helvetica').fillColor(SLATE).text('Sin módulos registrados.', 50, doc.y + 8);
      doc.y += 16;
    } else {
      const tableY2 = doc.y + 12;
      const rowH2 = 22;
      doc.rect(50, tableY2, W, rowH2).fill('#E2E8F0');
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold');
      doc.text('Módulo', 56, tableY2 + 7);
      doc.text('Estado', 230, tableY2 + 7);
      doc.text('Promedio', 310, tableY2 + 7);
      doc.text('Mejor puntaje', 390, tableY2 + 7);

      modules.forEach((mod, i) => {
        const rowY = tableY2 + rowH2 * (i + 1);
        if (doc.y + rowH2 > 740) { doc.addPage(); }
        if (i % 2 === 0) doc.rect(50, rowY, W, rowH2).fill('#F8FAFC');
        else doc.rect(50, rowY, W, rowH2).fill('#FFFFFF');

        const p = progressRows.find((pr) => pr.moduleId === mod.id);
        const status = p?.status ?? 'Sin iniciar';
        const avg = p ? `${p.avgScore.toFixed(1)}%` : '—';
        const best = p ? `${p.bestScore}%` : '—';

        const statusColor =
          status === 'Completado' ? GREEN : status === 'En curso' ? BLUE : SLATE;

        doc.fillColor(SLATE).fontSize(9).font('Helvetica');
        doc.text(mod.title, 56, rowY + 7, { width: 170, ellipsis: true });
        doc.fillColor(statusColor).text(status, 230, rowY + 7);
        doc.fillColor(SLATE).text(avg, 310, rowY + 7);
        doc.text(best, 390, rowY + 7);
      });

      doc.y = tableY2 + rowH2 * (modules.length + 1) + 8;
    }

    // ── AI Feedback ──────────────────────────────────────────────────────────
    const feedbackResults = results.filter((r) => r.feedback?.recommendations?.length > 0);
    if (feedbackResults.length > 0) {
      if (doc.y > 640) doc.addPage();

      doc
        .fillColor(DARK)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Retroalimentación del Motor de IA', 50, doc.y + 12);

      doc.y += 10;
      const maxItems = feedbackResults.slice(0, 3);
      for (const r of maxItems) {
        const recs: string[] = r.feedback?.recommendations ?? [];
        recs.slice(0, 3).forEach((rec) => {
          if (doc.y > 720) doc.addPage();
          doc.rect(50, doc.y + 8, 4, 14).fill(VIOLET);
          doc
            .fillColor(SLATE)
            .fontSize(9)
            .font('Helvetica')
            .text(rec, 62, doc.y + 8, { width: W - 20 });
          doc.y += 20;
        });
      }
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .rect(0, doc.page.height - 30, doc.page.width, 30)
        .fill('#F1F5F9');
      doc
        .fillColor('#94A3B8')
        .fontSize(7)
        .font('Helvetica')
        .text(
          `LeadShift · Plataforma de Habilidades Blandas · ${new Date().getFullYear()} · Página ${i + 1} de ${pageCount}`,
          0,
          doc.page.height - 18,
          { align: 'center', width: doc.page.width },
        );
    }

    doc.end();
  }

  // ── Individual assessment comparison ───────────────────────────────────────

  /**
   * Returns the full pretest/postest comparison for a specific user,
   * including per-skill deltas and improvement percentages.
   */
  async getComparisonForUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Alumno no encontrado');

    const assessments = await this.assessmentRepo.find({ where: { userId }, order: { completedAt: 'ASC' } });
    const pretest = assessments.find((a) => a.type === 'pretest');
    const postest = assessments.find((a) => a.type === 'postest');

    const improvements: Record<string, { before: number; after: number; delta: number; pctChange: number }> = {};
    if (pretest && postest) {
      for (const skill of Object.keys(pretest.scores)) {
        const before = pretest.scores[skill] ?? 0;
        const after = postest.scores[skill] ?? 0;
        improvements[skill] = {
          before,
          after,
          delta: after - before,
          pctChange: before > 0 ? Math.round(((after - before) / before) * 100) : 0,
        };
      }
    }

    const pretestAvg = pretest ? avgScores(pretest.scores) : null;
    const postestAvg = postest ? avgScores(postest.scores) : null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        career: user.career,
        semester: user.semester,
      },
      pretest: pretest ? { scores: pretest.scores, avg: pretestAvg, completedAt: pretest.completedAt } : null,
      postest: postest ? { scores: postest.scores, avg: postestAvg, completedAt: postest.completedAt } : null,
      improvements,
      avgImprovement:
        pretestAvg !== null && postestAvg !== null && pretestAvg > 0
          ? Math.round(((postestAvg - pretestAvg) / pretestAvg) * 100)
          : null,
    };
  }
}
