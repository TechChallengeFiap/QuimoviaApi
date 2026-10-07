import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

/** Nome do esquema de segurança do token de acesso no Swagger. */
export const BEARER_AUTH = 'bearer';

/**
 * Configuração do documento OpenAPI (Swagger) da API.
 *
 * Assim como o guard global de autenticação, a documentação exige o token de
 * acesso em todas as operações: o botão "Authorize" passa a enviá-lo. As rotas
 * públicas, como o login, removem essa exigência na própria operação.
 */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('QuimoviaAPI')
    .setDescription(
      'A QuimoviaAPI é uma API REST desenvolvida para o gerenciamento de produtos químicos, oferecendo recursos para cadastro, consulta, atualização e exclusão de produtos e suas respectivas informações.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Token de acesso obtido em POST /autenticacao/login, enviado no cabeçalho Authorization: Bearer <token>.',
      },
      BEARER_AUTH,
    )
    .addSecurityRequirements(BEARER_AUTH)
    .addTag('Autenticação', 'Login e encerramento das sessões dos usuários')
    .addTag('Produtos Químicos', 'Operações relacionadas aos produtos químicos')
    .addTag('Inspeções', 'Operações relacionadas as inspeções')
    .addTag(
      'Documentação das Cargas',
      'Operações relacionadas as documentações das cargas',
    )
    .addTag(
      'Operações dos usuários',
      'Operações relacionadas as operações dos usuários',
    )
    .build();
}
