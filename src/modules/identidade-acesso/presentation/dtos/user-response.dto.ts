import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';

/**
 * Representação de um usuário exposta pela API.
 *
 * Deliberadamente não inclui o hash da senha.
 */
interface UserResponseDtoData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResponseDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) name: string;
  @ApiProperty({ type: String }) email: string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @ApiProperty({ nullable: true, type: String }) lastLoginAt: Date | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;

  private constructor(data: UserResponseDtoData) {
    Object.assign(this, data);
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
