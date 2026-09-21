import type {
  FiltrosDeBuscaDeUsuarios,
  PaginaDeUsuarios,
  UsuarioRepository,
} from '../../src/application/usuarios/contracts/usuario.repository.js';
import type { Usuario } from '../../src/domain/usuarios/entities/usuario.entity.js';

/** Implementação em memória de UsuarioRepository, para uso nos testes. */
export class UsuarioRepositoryMock implements UsuarioRepository {
  private readonly usuarios = new Map<string, Usuario>();

  async criar(usuario: Usuario): Promise<Usuario> {
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  async atualizar(usuario: Usuario): Promise<Usuario> {
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  async remover(id: string): Promise<void> {
    this.usuarios.delete(id);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return [...this.usuarios.values()].find((usuario) => usuario.email === email) ?? null;
  }

  async listar(filtros: FiltrosDeBuscaDeUsuarios): Promise<PaginaDeUsuarios> {
    let itens = [...this.usuarios.values()];

    if (filtros.perfil) {
      itens = itens.filter((usuario) => usuario.perfil === filtros.perfil);
    }

    if (filtros.status) {
      itens = itens.filter((usuario) => usuario.status === filtros.status);
    }

    const total = itens.length;
    const inicio = (filtros.pagina - 1) * filtros.itensPorPagina;

    return {
      itens: itens.slice(inicio, inicio + filtros.itensPorPagina),
      total,
      pagina: filtros.pagina,
      itensPorPagina: filtros.itensPorPagina,
    };
  }
}
