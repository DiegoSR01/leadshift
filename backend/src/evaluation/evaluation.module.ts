import { Module } from '@nestjs/common';
import { LeadershipService } from './leadership.service';
import { OralCommunicationService } from './oral-communication.service';
import { WrittenCommunicationService } from './written-communication.service';

@Module({
  providers: [LeadershipService, OralCommunicationService, WrittenCommunicationService],
  exports: [LeadershipService, OralCommunicationService, WrittenCommunicationService],
})
export class EvaluationModule {}
