import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModulesService } from './modules.service';
import { PretestGuard } from './pretest.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /** Lists all modules. Requires JWT + completed Pretest. */
  @Get()
  @UseGuards(PretestGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.modulesService.findAll(user.id);
  }

  /** Gets a single module. Requires JWT + completed Pretest. */
  @Get(':id')
  @UseGuards(PretestGuard)
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Get('scenarios/:id')
  @UseGuards(AuthGuard('jwt'))
  getScenario(@Param('id') id: string) {
    return this.modulesService.getScenario(id);
  }

  @Get('exercises/:id')
  @UseGuards(AuthGuard('jwt'))
  getExercise(@Param('id') id: string) {
    return this.modulesService.getExercise(id);
  }
}
