import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getDashboard(user.id);
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getAnalytics(user.id);
  }

  @Get('results')
  getFinalResults(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getFinalResults(user.id);
  }
}
