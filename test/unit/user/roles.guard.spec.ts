import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import { Roles } from '@/modules/user/infrastructure/auth/roles.decorator.js';
import {
  INSUFFICIENT_ROLE_MESSAGE,
  RolesGuard,
} from '@/modules/user/infrastructure/auth/roles.guard.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/shared/presentation/decorators/api-requires-authentication.decorator.js';

class AdminController {
  @Roles(UserRole.SYSTEM_ADMIN)
  handler(): void {}
}

@Roles(UserRole.TECHNICAL_MANAGER, UserRole.OPERATIONS_MANAGER)
class ManagersController {
  handler(): void {}
}

class OpenController {
  handler(): void {}
}

type AnyController =
  typeof AdminController | typeof ManagersController | typeof OpenController;

function sessionWith(role: UserRole): AuthenticatedSession {
  return { userId: 'user-001', sessionId: 'session-001', role };
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  function contextFor(
    controller: AnyController,
    auth?: AuthenticatedSession,
  ): ExecutionContext {
    const request = { headers: {}, auth } as AuthenticatedRequest;

    return {
      getHandler: () => controller.prototype.handler,
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('libera o perfil exigido no endpoint', () => {
    expect(
      guard.canActivate(
        contextFor(AdminController, sessionWith(UserRole.SYSTEM_ADMIN)),
      ),
    ).toBe(true);
  });

  it('libera qualquer um dos perfis exigidos no controller', () => {
    expect(
      guard.canActivate(
        contextFor(
          ManagersController,
          sessionWith(UserRole.OPERATIONS_MANAGER),
        ),
      ),
    ).toBe(true);
  });

  it.each([
    UserRole.PORT_OPERATOR,
    UserRole.SHIPPER_DRIVER,
    UserRole.TECHNICAL_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  ])('responde 403 para o perfil %s', (role) => {
    expect(() =>
      guard.canActivate(contextFor(AdminController, sessionWith(role))),
    ).toThrow(new ForbiddenException(INSUFFICIENT_ROLE_MESSAGE));
  });

  it('libera as rotas sem @Roles()', () => {
    expect(guard.canActivate(contextFor(OpenController))).toBe(true);
  });

  it('responde 401 quando a rota não passou pelo AuthGuard', () => {
    expect(() => guard.canActivate(contextFor(AdminController))).toThrow(
      new UnauthorizedException(MISSING_ACCESS_TOKEN_MESSAGE),
    );
  });
});
