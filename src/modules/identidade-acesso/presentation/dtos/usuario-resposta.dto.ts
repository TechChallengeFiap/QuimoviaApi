import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../domain/enums/status-usuario.enum.js';

/**
 * Representação de um usuário exposta pela API.
 *
 * Deliberadamente não inclui o hash da senha.
 */
export class UsuarioRespostaDto {
  @ApiProperty() id: string;
  @ApiProperty() nome: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: PerfilUsuario }) perfil: PerfilUsuario;
  @ApiProperty({ enum: StatusUsuario }) status: StatusUsuario;
  @ApiProperty({ nullable: true, type: String }) ultimoLogin: Date | null;
  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;

  private constructor(dados: UsuarioRespostaDto) {
    Object.assign(this, dados);
  }

  static aPartirDaEntidade(usuario: Usuario): UsuarioRespostaDto {
    return new UsuarioRespostaDto({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      status: usuario.status,
      ultimoLogin: usuario.ultimoLogin,
      criadoEm: usuario.criadoEm,
      atualizadoEm: usuario.atualizadoEm,
    });
  }
}
