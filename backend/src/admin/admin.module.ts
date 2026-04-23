import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { Assessment } from '../entities/assessment.entity';
import { Result } from '../entities/result.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Assessment, Result, UserProgress, ModuleEntity]),
    AuthModule, // provides PassportModule / JwtStrategy needed by AdminGuard
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
