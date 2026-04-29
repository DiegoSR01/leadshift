import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/assessment.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentsService.create(user.id, dto);
  }

  /** Alias endpoint – same logic as POST / */
  @Post('submit')
  submit(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentsService.create(user.id, dto);
  }

  @Get()
  findByUser(@CurrentUser() user: { id: string }) {
    return this.assessmentsService.findByUser(user.id);
  }

  /** Returns pretest/postest completion flags and eligibility */
  @Get('status')
  getStatus(@CurrentUser() user: { id: string }) {
    return this.assessmentsService.getStatus(user.id);
  }

  @Get('comparison')
  getComparison(@CurrentUser() user: { id: string }) {
    return this.assessmentsService.getComparison(user.id);
  }
}
