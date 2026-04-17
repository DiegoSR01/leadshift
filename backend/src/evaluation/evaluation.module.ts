import { Module } from '@nestjs/common';
import { NlpModule } from '../nlp/nlp.module';
import { LeadershipService } from './leadership.service';
import { OralCommunicationService } from './oral-communication.service';
import { WrittenCommunicationService } from './written-communication.service';

@Module({
  imports: [NlpModule],
  providers: [LeadershipService, OralCommunicationService, WrittenCommunicationService],
  exports: [LeadershipService, OralCommunicationService, WrittenCommunicationService],
})
export class EvaluationModule {}
