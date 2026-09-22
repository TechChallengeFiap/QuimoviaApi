import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../domain/enums/status-usuario.enum.js';
import {
  ConflitoError,
  RecursoNaoEncontradoError,
} from '#shared/domain/errors/dominio.error.js';
import { PASSWORD_HASHER } from '../contracts/password-hasher.contract.js';
import type { PasswordHasher } from '../contracts/password-hasher.contract.js';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository.js';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';

export interface EntradaAtualizarUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
}

@Injectable()
export class AtualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(id: string, entrada: EntradaAtualizarUsuario): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);

    if (!usuario) {
      throw new RecursoNaoEncontradoError('Usuário', id);
    }

    if (entrada.nome !== undefined) {
      usuario.renomear(entrada.nome);
    }

    if (entrada.email !== undefined) {
      await this.alterarEmail(usuario, entrada.email);
    }

    if (entrada.senha !== undefined) {
      usuario.alterarSenha(await this.passwordHasher.hash(entrada.senha));
    }

    if (entrada.perfil !== undefined) {
      usuario.alterarPerfil(entrada.perfil);
    }

    if (entrada.status !== undefined) {
      this.alterarStatus(usuario, entrada.status);
    }

    return this.usuarios.atualizar(usuario);
  }

  private async alterarEmail(usuario: Usuario, email: string): Promise<void> {
    const emailNormalizado = email.trim().toLowerCase();

    if (emailNormalizado === usuario.email) {
      return;
    }

    const jaCadastrado = await this.usuarios.buscarPorEmail(emailNormalizado);

    if (jaCadastrado) {
      throw new ConflitoError(
        `Já existe um usuário cadastrado com o e-mail "${emailNormalizado}".`,
      );
    }

    usuario.alterarEmail(emailNormalizado);
  }

  /**
   * As transições passam pelos métodos da entidade para que as regras de
   * bloqueio e desbloqueio sejam respeitadas.
   */
  private alterarStatus(usuario: Usuario, status: StatusUsuario): void {
    if (usuario.status === status) {
      return;
    }

    switch (status) {
      case StatusUsuario.ATIVO:
        if (usuario.status === StatusUsuario.BLOQUEADO) {
          usuario.desbloquear();
        } else {
          usuario.ativar();
        }
        break;
      case StatusUsuario.INATIVO:
        usuario.desativar();
        break;
      case StatusUsuario.BLOQUEADO:
        usuario.bloquear();
        break;
    }
  }
}
