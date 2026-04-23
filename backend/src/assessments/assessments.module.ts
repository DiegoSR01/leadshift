import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../entities/assessment.entity';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment])],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
