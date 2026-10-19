import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

/**
 * O perfil fica de fora: a troca de perfil tem rota própria, exclusiva do
 * Administrador do Sistema (PATCH /users/:id/role).
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['role'] as const),
) {
  @ApiProperty({ type: String, required: false, minLength: 3 })
  declare name?: string;

  @ApiProperty({ type: String, format: 'email', required: false })
  declare email?: string;

  @ApiProperty({
    type: String,
    format: 'password',
    required: false,
    minLength: 8,
    writeOnly: true,
  })
  declare password?: string;
}
