import { IsNotEmpty, IsString } from 'class-validator';

export class CancelRegistrationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
