import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResultsService } from './results.service';
import { SubmitScenarioDto, SubmitOralDto, SubmitWrittenDto } from './dto/submit.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/results')
@UseGuards(AuthGuard('jwt'))
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post('scenario')
  submitScenario(
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitScenarioDto,
  ) {
    return this.resultsService.submitScenario(user.id, dto.scenarioId, dto.selectedOption);
  }

  @Post('oral')
  submitOral(
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitOralDto,
  ) {
    return this.resultsService.submitOral(user.id, dto.exerciseId, dto.transcript);
  }

  @Post('written')
  submitWritten(
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitWrittenDto,
  ) {
    return this.resultsService.submitWritten(user.id, dto.exerciseId, dto.text);
  }

  @Get()
  getUserResults(@CurrentUser() user: { id: string }) {
    return this.resultsService.getUserResults(user.id);
  }
}
