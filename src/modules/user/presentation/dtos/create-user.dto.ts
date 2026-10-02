import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

export class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'Nome completo do usuário',
    minLength: 3,
    example: 'Maria Silva',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    description: 'E-mail do usuário; deve ser único no sistema',
    example: 'maria.silva@quimovia.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    type: String,
    format: 'password',
    description: 'Senha de acesso; é armazenada apenas como hash',
    minLength: 8,
    writeOnly: true,
    example: 'S3nhaForte!',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Perfil de acesso do usuário',
    example: UserRole.PORT_OPERATOR,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    enum: UserStatus,
    enumName: 'UserStatus',
    required: false,
    default: UserStatus.ACTIVE,
    description:
      'Situação inicial do usuário; quando omitida, o usuário é criado ativo',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
