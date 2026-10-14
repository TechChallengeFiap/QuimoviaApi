import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import type { AuthenticatedRequest } from '@/modules/user/presentation/guards/authenticated-request.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/modules/user/presentation/decorators/api-requires-authentication.decorator.js';

/**
 * Sessão autenticada da requisição, preenchida pelo AuthGuard. Só pode ser
 * usada em rotas com @UseGuards(AuthGuard); sem o guard, não há sessão para
 * devolver.
 */
export const CurrentSession = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedSession => {
    const { auth } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!auth) {
      throw new UnauthorizedException(MISSING_ACCESS_TOKEN_MESSAGE);
    }

    return auth;
  },
);
