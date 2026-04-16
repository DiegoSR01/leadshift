import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModulesService } from './modules.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/modules')
@UseGuards(AuthGuard('jwt'))
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.modulesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Get('scenarios/:id')
  getScenario(@Param('id') id: string) {
    return this.modulesService.getScenario(id);
  }

  @Get('exercises/:id')
  getExercise(@Param('id') id: string) {
    return this.modulesService.getExercise(id);
  }
}
