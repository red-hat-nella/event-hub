import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthenticateDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
