import { Module } from '@nestjs/common';
import { AtualizarUsuarioUseCase } from '#application/usuarios/use-cases/atualizar-usuario.use-case.js';
import { BuscarUsuarioPorIdUseCase } from '#application/usuarios/use-cases/buscar-usuario-por-id.use-case.js';
import { CriarUsuarioUseCase } from '#application/usuarios/use-cases/criar-usuario.use-case.js';
import { ListarUsuariosUseCase } from '#application/usuarios/use-cases/listar-usuarios.use-case.js';
import { RemoverUsuarioUseCase } from '#application/usuarios/use-cases/remover-usuario.use-case.js';
import { HASH_DE_SENHA } from '#application/usuarios/contracts/hash-de-senha.js';
import { USUARIO_REPOSITORY } from '#application/usuarios/contracts/usuario.repository.js';
import { ScryptHashDeSenha } from '#infrastructure/shared/crypto/scrypt-hash-de-senha.js';
import { PrismaUsuarioRepository } from '#infrastructure/usuarios/repositories/prisma-usuario.repository.js';
import { UsuariosController } from './controllers/usuarios.controller.js';

@Module({
  controllers: [UsuariosController],
  providers: [
    CriarUsuarioUseCase,
    ListarUsuariosUseCase,
    BuscarUsuarioPorIdUseCase,
    AtualizarUsuarioUseCase,
    RemoverUsuarioUseCase,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: HASH_DE_SENHA, useClass: ScryptHashDeSenha },
  ],
})
export class UsuariosModule {}
