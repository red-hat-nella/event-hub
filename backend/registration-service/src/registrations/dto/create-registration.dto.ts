import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  eventId!: string;
}
