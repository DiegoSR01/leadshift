import { IsObject, IsIn, IsNotEmpty } from 'class-validator';

export class CreateAssessmentDto {
  @IsIn(['pretest', 'postest'])
  type: 'pretest' | 'postest';

  @IsObject()
  @IsNotEmpty()
  scores: Record<string, number>;
}
