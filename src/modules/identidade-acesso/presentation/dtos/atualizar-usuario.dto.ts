import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CriarUsuarioDto } from './criar-usuario.dto.js';

export class AtualizarUsuarioDto extends PartialType(CriarUsuarioDto) {
  @ApiProperty({ required: false, minLength: 3 })
  declare nome?: string;

  @ApiProperty({ required: false })
  declare email?: string;

  @ApiProperty({ required: false, minLength: 8, writeOnly: true })
  declare senha?: string;
}
