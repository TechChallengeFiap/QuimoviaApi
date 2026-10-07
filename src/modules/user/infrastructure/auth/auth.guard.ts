import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';
import { IS_PUBLIC_ROUTE } from '@/shared/presentation/decorators/public.decorator.js';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';

/**
 * Guard global de autenticação (RN-GER-01): toda rota exige um token de
 * acesso de uma sessão ativa, exceto as marcadas com @Public().
 *
 * Responde 401 por conta própria, sem depender dos filtros de exceção de
 * cada controller.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ValidateSessionUseCase)
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = AuthGuard.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException(MISSING_ACCESS_TOKEN_MESSAGE);
    }

    try {
      request.auth = await this.validateSessionUseCase.execute(token);
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }

  /** Lê o token do cabeçalho "Authorization: Bearer <token>". */
  private static extractBearerToken(header?: string): string | null {
    const [scheme, token, ...rest] = header?.trim().split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
      return null;
    }

    return token;
  }
}
