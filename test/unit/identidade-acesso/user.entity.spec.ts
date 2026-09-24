import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.js';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createValidUser(override: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create({
    name: 'Maria Silva',
    email: 'MARIA.silva@quimovia.com',
    passwordHash: 'hash-fake',
    role: UserRole.PORT_OPERATOR,
    ...override,
  });
}

describe('User', () => {
  it('cria um usuário ativo por padrão, com o e-mail normalizado', () => {
    const user = createValidUser();

    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.email).toBe('maria.silva@quimovia.com');
    expect(user.id).toEqual(expect.any(String));
  });

  it('rejeita nome menor que 3 caracteres', () => {
    expect(() => createValidUser({ name: 'Al' })).toThrow(BusinessRuleError);
  });

  it('rejeita e-mail em formato inválido', () => {
    expect(() => createValidUser({ email: 'invalido' })).toThrow(BusinessRuleError);
  });

  it('não permite ativar um usuário bloqueado diretamente', () => {
    const user = createValidUser();
    user.block();

    expect(() => user.activate()).toThrow(BusinessRuleError);
  });

  it('permite desbloquear um usuário bloqueado', () => {
    const user = createValidUser();
    user.block();
    user.unblock();

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('só permite autenticação quando o usuário está ativo', () => {
    const user = createValidUser();
    user.deactivate();

    expect(user.canAuthenticate()).toBe(false);
    expect(() => user.registerLogin()).toThrow(BusinessRuleError);
  });

  it('registra o momento do último login ao autenticar', () => {
    const user = createValidUser();
    const at = new Date('2026-01-01T10:00:00Z');

    user.registerLogin(at);

    expect(user.lastLoginAt).toEqual(at);
  });
});
