import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import { REQUIRED_ROLES } from '@/modules/user/infrastructure/auth/roles.decorator.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';

export const INSUFFICIENT_ROLE_MESSAGE =
  'O perfil do usuário não tem permissão para executar esta operação.';

/**
 * Guard de autorização por perfil (RN-ACE-04): libera a rota só para os
 * perfis informados em @Roles(). Usa o perfil atual do usuário, lido pelo
 * AuthGuard a cada requisição, então uma troca de perfil vale já na próxima
 * operação.
 *
 * Deve ser aplicado depois do AuthGuard: @UseGuards(AuthGuard, RolesGuard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!roles || roles.length === 0) {
      return true;
    }

    const { auth } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!auth) {
      throw new UnauthorizedException(MISSING_ACCESS_TOKEN_MESSAGE);
    }

    if (!roles.includes(auth.role)) {
      throw new ForbiddenException(INSUFFICIENT_ROLE_MESSAGE);
    }

    return true;
  }
}
