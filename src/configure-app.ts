import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';

/**
 * Registra a validação e a tradução dos erros de domínio para todas as rotas.
 * O main.ts e os testes E2E usam esta mesma configuração.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter(app.get(HttpAdapterHost)));
}
