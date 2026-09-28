import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

/**
 * Representação de um usuário exposta pela API.
 *
 * Deliberadamente não inclui o hash da senha.
 */
export class UserResponseDto {
  @ApiProperty({
    type: String,
    description: 'Identificador do usuário',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Nome completo do usuário',
    example: 'Maria Silva',
  })
  name: string;

  @ApiProperty({
    type: String,
    format: 'email',
    description: 'E-mail do usuário, sempre em letras minúsculas',
    example: 'maria.silva@quimovia.com',
  })
  email: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Perfil de acesso do usuário',
    example: UserRole.PORT_OPERATOR,
  })
  role: UserRole;

  @ApiProperty({
    enum: UserStatus,
    enumName: 'UserStatus',
    description: 'Situação atual do usuário',
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    type: Date,
    nullable: true,
    description:
      'Data e hora do último login; nulo enquanto o usuário não se autenticar',
    example: '2026-09-25T14:30:00.000Z',
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    type: Date,
    description: 'Data e hora do cadastro',
    example: '2026-09-25T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Data e hora da última atualização',
    example: '2026-09-25T12:00:00.000Z',
  })
  updatedAt: Date;

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
