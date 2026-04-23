import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Requires a valid JWT **and** role === 'admin'.
 * Extends the built-in JwtAuthGuard so we don't duplicate JWT validation logic.
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, validate the JWT (sets req.user via JwtStrategy.validate)
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Acceso restringido al panel de administración');
    }

    return true;
  }
}
