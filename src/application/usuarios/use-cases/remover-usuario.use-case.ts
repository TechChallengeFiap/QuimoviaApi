import { Inject, Injectable } from '@nestjs/common';
import { RecursoNaoEncontradoError } from '../../../shared/errors/dominio.error.js';
import { USUARIO_REPOSITORY } from '../contracts/usuario.repository.js';
import type { UsuarioRepository } from '../contracts/usuario.repository.js';

@Injectable()
export class RemoverUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository) {}

  async executar(id: string): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(id);

    if (!usuario) {
      throw new RecursoNaoEncontradoError('Usuário', id);
    }

    await this.usuarios.remover(id);
  }
}
