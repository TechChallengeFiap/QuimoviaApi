import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BEARER_AUTH } from '@/shared/presentation/docs/swagger.config.js';

export const MISSING_ACCESS_TOKEN_MESSAGE =
  'Token de acesso não informado. Envie o cabeçalho Authorization: Bearer <token>.';

/**
 * Documenta no Swagger uma rota protegida pelo AuthGuard: exige o token de
 * acesso (botão "Authorize") e descreve a resposta 401.
 */
export function ApiRequiresAuthentication() {
  return applyDecorators(
    ApiBearerAuth(BEARER_AUTH),
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
