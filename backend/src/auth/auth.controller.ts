import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { CurrentUser } from './current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }

  /**
   * One-time admin setup endpoint.
   * Only succeeds if there are NO admins in the database yet.
   * After one admin exists, this endpoint returns 403 forever.
   */
  @Post('setup-admin')
  setupAdmin(
    @Body() dto: { name: string; email: string; password: string },
  ) {
    return this.authService.setupAdmin(dto);
  }
}
