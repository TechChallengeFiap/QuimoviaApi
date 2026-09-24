import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';

/**
 * Representação de um usuário exposta pela API.
 *
 * Deliberadamente não inclui o hash da senha.
 */
export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @ApiProperty({ nullable: true, type: String }) lastLoginAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  private constructor(data: UserResponseDto) {
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
