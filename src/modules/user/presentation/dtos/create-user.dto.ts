import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva', minLength: 3 })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ example: 'maria.silva@quimovia.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3nhaForte!', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PORT_OPERATOR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ enum: UserStatus, required: false, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
