import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiUnauthorizedResponse } from '@nestjs/swagger';

export const MISSING_ACCESS_TOKEN_MESSAGE =
  'Token de acesso não informado. Envie o cabeçalho Authorization: Bearer <token>.';

/**
 * Documenta no Swagger a resposta 401 das rotas protegidas pelo guard global
 * de autenticação. O envio do token já é exigido pela configuração do Swagger.
 */
export function ApiRequiresAuthentication() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description:
        'Token de acesso ausente, inválido ou expirado, ou sessão encerrada; é preciso fazer login novamente.',
      schema: {
        example: {
          message: MISSING_ACCESS_TOKEN_MESSAGE,
          error: 'Unauthorized',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      },
    }),
  );
}
