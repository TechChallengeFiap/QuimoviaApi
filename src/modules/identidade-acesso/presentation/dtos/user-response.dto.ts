import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity.js';
import { UserRole } from '../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../domain/enums/user-status.enum.js';

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
