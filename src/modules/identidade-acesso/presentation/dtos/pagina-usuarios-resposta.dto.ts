import { ApiProperty } from '@nestjs/swagger';
import { PaginaDeUsuarios } from '../../domain/repositories/usuario.repository.js';
import { UsuarioRespostaDto } from './usuario-resposta.dto.js';

export class PaginaUsuariosRespostaDto {
  @ApiProperty({ type: [UsuarioRespostaDto] })
  itens: UsuarioRespostaDto[];

  @ApiProperty() total: number;
  @ApiProperty() pagina: number;
  @ApiProperty() itensPorPagina: number;

  private constructor(dados: PaginaUsuariosRespostaDto) {
    Object.assign(this, dados);
  }

  static aPartirDaPagina(pagina: PaginaDeUsuarios): PaginaUsuariosRespostaDto {
    return new PaginaUsuariosRespostaDto({
      itens: pagina.itens.map((usuario) => UsuarioRespostaDto.aPartirDaEntidade(usuario)),
      total: pagina.total,
      pagina: pagina.pagina,
      itensPorPagina: pagina.itensPorPagina,
    });
  }
}
