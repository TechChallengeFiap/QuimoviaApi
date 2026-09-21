import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../../../domain/usuarios/entities/usuario.entity.js';
import { PerfilUsuario } from '../../../domain/usuarios/value-objects/perfil-usuario.js';
import { StatusUsuario } from '../../../domain/usuarios/value-objects/status-usuario.js';
import { ConflitoError } from '../../../shared/errors/dominio.error.js';
import { HASH_DE_SENHA } from '../contracts/hash-de-senha.js';
import type { HashDeSenha } from '../contracts/hash-de-senha.js';
import { USUARIO_REPOSITORY } from '../contracts/usuario.repository.js';
import type { UsuarioRepository } from '../contracts/usuario.repository.js';

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
    @Inject(HASH_DE_SENHA) private readonly hashDeSenha: HashDeSenha,
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
      senhaHash: await this.hashDeSenha.gerar(entrada.senha),
      perfil: entrada.perfil,
      status: entrada.status,
    });

    return this.usuarios.criar(usuario);
  }
}
