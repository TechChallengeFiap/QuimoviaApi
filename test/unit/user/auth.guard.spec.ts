import { jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { AuthGuard } from '@/modules/user/presentation/guards/auth.guard.js';
import type { AuthenticatedRequest } from '@/modules/user/presentation/guards/authenticated-request.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { MISSING_ACCESS_TOKEN_MESSAGE } from '@/modules/user/presentation/decorators/api-requires-authentication.decorator.js';

const session: AuthenticatedSession = {
  userId: 'user-001',
  sessionId: 'session-001',
  role: UserRole.PORT_OPERATOR,
};

describe('AuthGuard', () => {
  let execute: jest.Mock<ValidateSessionUseCase['execute']>;
  let guard: AuthGuard;

  beforeEach(() => {
    execute = jest.fn<ValidateSessionUseCase['execute']>();
    guard = new AuthGuard({
      execute,
    } as unknown as ValidateSessionUseCase);
  });

  function contextFor(authorization?: string): {
    context: ExecutionContext;
    request: AuthenticatedRequest;
  } {
    const request = {
      headers: authorization ? { authorization } : {},
    } as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  it.each([
    ['sem o cabeçalho', undefined],
    ['com outro esquema', 'Basic dXN1YXJpbzpzZW5oYQ=='],
    ['sem o token', 'Bearer'],
    ['com partes a mais', 'Bearer token extra'],
  ])('responde 401 %s', async (_, authorization) => {
    const { context } = contextFor(authorization);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(MISSING_ACCESS_TOKEN_MESSAGE),
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('valida o token e guarda a sessão na requisição', async () => {
    execute.mockResolvedValueOnce(session);
    const { context, request } = contextFor('  bearer   token-001 ');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(execute).toHaveBeenCalledWith('token-001');
    expect(request.auth).toEqual(session);
  });

  it('responde 401 com a mensagem da sessão inválida', async () => {
    execute.mockRejectedValueOnce(
      new AuthenticationError('Sessão expirada ou encerrada.'),
    );
    const { context } = contextFor('Bearer token-001');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Sessão expirada ou encerrada.'),
    );
  });

  it('propaga os erros que não são de autenticação', async () => {
    const failure = new Error('Falha de conexão com o banco');
    execute.mockRejectedValueOnce(failure);
    const { context } = contextFor('Bearer token-001');

    await expect(guard.canActivate(context)).rejects.toBe(failure);
  });
});
