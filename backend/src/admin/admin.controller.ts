import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Platform-wide KPI statistics */
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  /** Full student roster with pretest/postest scores and progress */
  @Get('users')
  getUsers() {
    return this.adminService.getUserList();
  }

  /**
   * Pretest vs Postest comparison for a specific student.
   * GET /api/admin/assessments/compare/:userId
   */
  @Get('assessments/compare/:userId')
  getComparisonForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.getComparisonForUser(userId);
  }

  /**
   * Group CSV export — streams a UTF-8 CSV compatible with Excel / SPSS.
   * GET /api/admin/reports/csv
   */
  @Get('reports/csv')
  async downloadCsv(@Res() res: Response) {
    await this.adminService.streamCsv(res);
  }

  /**
   * Individual PDF report — streams a PDF with charts, scores and AI feedback.
   * GET /api/admin/reports/pdf/:userId
   */
  @Get('reports/pdf/:userId')
  async downloadPdf(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Res() res: Response,
  ) {
    await this.adminService.streamPdf(userId, res);
  }
}
