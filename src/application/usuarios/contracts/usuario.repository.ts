import { Usuario } from '../../../domain/usuarios/entities/usuario.entity.js';
import { PerfilUsuario } from '../../../domain/usuarios/value-objects/perfil-usuario.js';
import { StatusUsuario } from '../../../domain/usuarios/value-objects/status-usuario.js';

export interface FiltrosDeBuscaDeUsuarios {
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
  pagina: number;
  itensPorPagina: number;
}

export interface PaginaDeUsuarios {
  itens: Usuario[];
  total: number;
  pagina: number;
  itensPorPagina: number;
}

/**
 * Porta de persistência do agregado Usuário.
 *
 * A camada de aplicação depende apenas desta interface; a implementação
 * concreta (Prisma) vive na camada de infraestrutura.
 */
export interface UsuarioRepository {
  criar(usuario: Usuario): Promise<Usuario>;
  atualizar(usuario: Usuario): Promise<Usuario>;
  remover(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(filtros: FiltrosDeBuscaDeUsuarios): Promise<PaginaDeUsuarios>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
