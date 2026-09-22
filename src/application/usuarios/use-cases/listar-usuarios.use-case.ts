import { Inject, Injectable } from '@nestjs/common';
import { PerfilUsuario } from '#domain/usuarios/value-objects/perfil-usuario.js';
import { StatusUsuario } from '#domain/usuarios/value-objects/status-usuario.js';
import { USUARIO_REPOSITORY } from '../contracts/usuario.repository.js';
import type {
  PaginaDeUsuarios,
  UsuarioRepository,
} from '../contracts/usuario.repository.js';

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
