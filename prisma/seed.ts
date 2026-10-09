import 'dotenv/config';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  loadInitialAdminConfig,
  seedInitialAdmin,
} from '@/modules/user/infrastructure/persistence/prisma/seed/initial-admin.seed.js';
import { UserModule } from '@/modules/user/user.module.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

/** Só o necessário para cadastrar usuários, sem subir a API. */
@Module({ imports: [PrismaModule, UserModule] })
class SeedModule {}

const logger = new Logger('Seed');

async function seed(): Promise<void> {
  const config = loadInitialAdminConfig();
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  // Os logs de inicialização do Nest ficam de fora; o resultado do seed, não.
  Logger.overrideLogger(['log', 'error', 'warn']);

  try {
    const { created, user } = await seedInitialAdmin(
      app.get<UserRepository>(USER_REPOSITORY),
      app.get(CreateUserUseCase),
      config,
    );

    logger.log(
      created
        ? `Administrador inicial criado: ${user.email}`
        : `O e-mail ${user.email} já está cadastrado; nada foi alterado.`,
    );
  } finally {
    await app.get(PrismaService).$disconnect();
    await app.close();
  }
}

seed().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
