import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';

export class ChangeUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Novo perfil de acesso do usuário',
    example: UserRole.OPERATIONS_MANAGER,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
