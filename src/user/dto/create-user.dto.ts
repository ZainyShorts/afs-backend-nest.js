// create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Role } from '../schema/user.schema';

export class CreateUserDto {
  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

  @IsOptional()
  @IsEnum(Role)
  readonly role: 'admin' | 'manager' | 'employee' | 'agent';

  @IsBoolean()
  readonly access: boolean;
}
