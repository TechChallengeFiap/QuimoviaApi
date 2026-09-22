import { Module } from '@nestjs/common';
import { AtualizarUsuarioUseCase } from './application/use-cases/atualizar-usuario.use-case.js';
import { BuscarUsuarioPorIdUseCase } from './application/use-cases/buscar-usuario-por-id.use-case.js';
import { CriarUsuarioUseCase } from './application/use-cases/criar-usuario.use-case.js';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case.js';
import { RemoverUsuarioUseCase } from './application/use-cases/remover-usuario.use-case.js';
import { PASSWORD_HASHER } from './application/contracts/password-hasher.contract.js';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository.js';
import { ScryptPasswordHasher } from './infrastructure/services/password-hasher.service.js';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma/prisma-usuario.repository.js';
import { UsuariosController } from './presentation/controllers/usuarios.controller.js';

@Module({
  controllers: [UsuariosController],
  providers: [
    CriarUsuarioUseCase,
    ListarUsuariosUseCase,
    BuscarUsuarioPorIdUseCase,
    AtualizarUsuarioUseCase,
    RemoverUsuarioUseCase,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
})
export class IdentidadeAcessoModule {}
