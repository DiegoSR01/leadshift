import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../entities/assessment.entity';

/**
 * Requires a valid JWT **and** that the user has completed the Pretest.
 * Access to learning modules is blocked until the Pretest is done.
 */
@Injectable()
export class PretestGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Validate JWT first
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();
    const userId: string = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('No autenticado');
    }

    const pretest = await this.assessmentRepo.findOne({
      where: { userId, type: 'pretest' },
    });

    if (!pretest) {
      throw new ForbiddenException(
        'Debes completar el Pretest de diagnóstico antes de acceder a los módulos',
      );
    }

    return true;
  }
}
