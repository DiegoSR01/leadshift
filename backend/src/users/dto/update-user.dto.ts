import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  settings?: {
    notifications?: boolean;
    emailDigest?: boolean;
    publicProfile?: boolean;
    darkMode?: boolean;
  };
}
