import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * GET /api/gamification
   * Returns the full gamification snapshot for the current user:
   * XP, level, streak, badges, recent XP events, motivational message.
   */
  @Get()
  getSnapshot(@CurrentUser() user: { id: string }) {
    return this.gamificationService.getSnapshot(user.id);
  }
}
