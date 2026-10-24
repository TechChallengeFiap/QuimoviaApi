import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';

/**
 * Guard de autenticação (RN-GER-01): exige o token de acesso de uma sessão
 * ativa nas rotas em que é aplicado, com @UseGuards(AuthGuard) no controller
 * ou no endpoint. O módulo do controller precisa importar o AuthModule.
 *
 * Responde 401 por conta própria, sem depender dos filtros de exceção de
 * cada controller.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(ValidateSessionUseCase)
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
  static extractBearerToken(header?: string): string | null {
    const [scheme, token, ...rest] = header?.trim().split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
      return null;
    }

    return token;
  }
}
