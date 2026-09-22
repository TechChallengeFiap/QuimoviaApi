import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { RecursoNaoEncontradoError } from '#shared/domain/errors/dominio.error.js';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository.js';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';

@Injectable()
export class BuscarUsuarioPorIdUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository) {}

  async executar(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);

    if (!usuario) {
      throw new RecursoNaoEncontradoError('Usuário', id);
    }

    return usuario;
  }
}
