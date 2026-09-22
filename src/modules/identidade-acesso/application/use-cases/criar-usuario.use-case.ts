import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../domain/enums/status-usuario.enum.js';
import { ConflitoError } from '#shared/domain/errors/dominio.error.js';
import { PASSWORD_HASHER } from '../contracts/password-hasher.contract.js';
import type { PasswordHasher } from '../contracts/password-hasher.contract.js';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository.js';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';

export interface EntradaCriarUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  status?: StatusUsuario;
}

@Injectable()
export class CriarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(entrada: EntradaCriarUsuario): Promise<Usuario> {
    const email = entrada.email.trim().toLowerCase();
    const jaCadastrado = await this.usuarios.buscarPorEmail(email);

    if (jaCadastrado) {
      throw new ConflitoError(`Já existe um usuário cadastrado com o e-mail "${email}".`);
    }

    const usuario = Usuario.criar({
      nome: entrada.nome,
      email,
      senhaHash: await this.passwordHasher.hash(entrada.senha),
      perfil: entrada.perfil,
      status: entrada.status,
    });

    return this.usuarios.criar(usuario);
  }
}
