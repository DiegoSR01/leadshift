import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitScenarioDto {
  @IsString()
  @IsNotEmpty()
  scenarioId: string;

  @IsString()
  @IsNotEmpty()
  selectedOption: string;
}

export class SubmitOralDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  /** Transcribed text (or raw text for testing). In production, audio will be transcribed via Whisper. */
  @IsString()
  @IsNotEmpty()
  transcript: string;
}

export class SubmitWrittenDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
