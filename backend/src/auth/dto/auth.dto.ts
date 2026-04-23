import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, Min, Max } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  university: string;

  @IsString()
  @IsNotEmpty()
  career: string;

  @IsInt()
  @Min(1)
  @Max(14)
  semester: number;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
