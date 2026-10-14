import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

/**
 * Conexão única com o banco, compartilhada pelos contextos.
 *
 * Não é global: cada módulo de contexto que tem persistência importa este
 * módulo, declarando a dependência. O NestJS reaproveita a mesma instância do
 * PrismaService em todos os imports. Só os repositórios em
 * infrastructure/persistence/ injetam o PrismaService.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
