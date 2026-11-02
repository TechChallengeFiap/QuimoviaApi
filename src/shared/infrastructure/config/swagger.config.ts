import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

/** Nome do esquema de segurança do token de acesso no Swagger. */
export const BEARER_AUTH = 'bearer';

/**
 * Configuração do documento OpenAPI (Swagger) da API.
 *
 * Registra o esquema do token de acesso (botão "Authorize"). Só as operações
 * protegidas pelo AuthGuard o exigem, com @ApiRequiresAuthentication().
 */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('QuimoviaAPI')
    .setDescription(
      'A QuimoviaAPI é uma API REST desenvolvida para o gerenciamento logístico, fiscal e operacional de produtos e cargas químicas em contexto portuário (Porto de Santos), garantindo controle rigoroso do ciclo de vida, conformidade documental e segurança no pátio.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Token de acesso obtido em POST /auth/login, enviado no cabeçalho Authorization: Bearer <token>.',
      },
      BEARER_AUTH,
    )
    .addTag('Autenticação', 'Login e encerramento das sessões dos usuários')
    .addTag('Produtos Químicos', 'Operações relacionadas aos produtos químicos')
    .addTag('Cargas Químicas', 'Operações e ciclo de vida das cargas químicas portuárias')
    .addTag('Inspeções', 'Operações relacionadas às inspeções portuárias')
    .addTag(
      'Documentação das Cargas',
      'Operações relacionadas às documentações e dossiês das cargas',
    )
    .addTag(
      'Operações dos usuários',
      'Operações relacionadas à gestão e cadastro de usuários',
    )
    .build();
}
