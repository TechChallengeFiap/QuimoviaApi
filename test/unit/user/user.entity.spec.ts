import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createValidUser(
  override: Partial<Parameters<typeof User.create>[0]> = {},
) {
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
    expect(() => createValidUser({ email: 'invalido' })).toThrow(
      BusinessRuleError,
    );
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

  describe('exclusão lógica', () => {
    it('marca o usuário como excluído, sem apagar os dados, e tira o acesso', () => {
      const user = createValidUser();
      const at = new Date('2026-10-19T12:00:00.000Z');

      user.delete(at);

      expect(user.isDeleted).toBe(true);
      expect(user.deletedAt).toEqual(at);
      expect(user.email).toBe('maria.silva@quimovia.com');
      expect(user.canAuthenticate()).toBe(false);
    });

    it('não exclui duas vezes', () => {
      const user = createValidUser();
      user.delete();

      expect(() => user.delete()).toThrow(BusinessRuleError);
    });

    it('reativa o cadastro excluído com os novos dados, mantendo id e e-mail', () => {
      const user = createValidUser();
      user.block();
      user.delete();

      user.reregister({
        name: 'Maria Souza',
        passwordHash: 'hash-novo',
        role: UserRole.TECHNICAL_MANAGER,
      });

      expect(user).toMatchObject({
        name: 'Maria Souza',
        email: 'maria.silva@quimovia.com',
        passwordHash: 'hash-novo',
        role: UserRole.TECHNICAL_MANAGER,
        status: UserStatus.ACTIVE,
        isDeleted: false,
        deletedAt: null,
      });
      expect(user.canAuthenticate()).toBe(true);
    });

    it('valida os novos dados ao reativar o cadastro', () => {
      const user = createValidUser();
      user.delete();

      expect(() =>
        user.reregister({
          name: 'Al',
          passwordHash: 'hash-novo',
          role: UserRole.PORT_OPERATOR,
        }),
      ).toThrow(BusinessRuleError);
      expect(user.isDeleted).toBe(true);
    });

    it('só reativa o cadastro de um usuário excluído', () => {
      expect(() =>
        createValidUser().reregister({
          name: 'Maria Souza',
          passwordHash: 'hash-novo',
          role: UserRole.PORT_OPERATOR,
        }),
      ).toThrow(BusinessRuleError);
    });

    it('trata como não excluído o usuário restaurado sem a data de exclusão', () => {
      const { deletedAt: _, ...properties } = createValidUser().toObject();

      expect(User.restore(properties).isDeleted).toBe(false);
    });
  });
});
