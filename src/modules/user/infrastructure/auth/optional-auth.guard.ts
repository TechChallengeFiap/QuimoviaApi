import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

/**
 * Guard de autenticação opcional: se o token Bearer estiver presente no
 * cabeçalho Authorization, valida a sessão e popula `request.auth`.
 * Se nenhum token for informado, permite a requisição sem autenticação.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(ValidateSessionUseCase)
    private readonly validateSessionUseCase: ValidateSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers?.authorization;
    const token = AuthGuard.extractBearerToken(header);

    if (!token) {
      return true;
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
}
