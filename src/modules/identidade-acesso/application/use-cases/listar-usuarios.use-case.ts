import { Inject, Injectable } from '@nestjs/common';
import { PerfilUsuario } from '../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../domain/enums/status-usuario.enum.js';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository.js';
import type {
  PaginaDeUsuarios,
  UsuarioRepository,
} from '../../domain/repositories/usuario.repository.js';

export const PAGINA_PADRAO = 1;
export const ITENS_POR_PAGINA_PADRAO = 20;

export interface EntradaListarUsuarios {
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
  pagina?: number;
  itensPorPagina?: number;
}

@Injectable()
export class ListarUsuariosUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository) {}

  async executar(entrada: EntradaListarUsuarios = {}): Promise<PaginaDeUsuarios> {
    return this.usuarios.listar({
      perfil: entrada.perfil,
      status: entrada.status,
      pagina: entrada.pagina ?? PAGINA_PADRAO,
      itensPorPagina: entrada.itensPorPagina ?? ITENS_POR_PAGINA_PADRAO,
    });
  }
}
