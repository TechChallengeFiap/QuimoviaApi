import {
  UserRole,
  UserStatus,
  type UserDirectory,
  type UserSummary,
} from '@/modules/user/public/index.js';

/** Resumo de usuário válido para os testes, com os campos sobrescritos. */
export function userSummary(
  override: Partial<UserSummary> & Pick<UserSummary, 'id'>,
): UserSummary {
  return {
    name: 'Operador Teste',
    email: `${override.id}@quimovia.com`,
    role: UserRole.PORT_OPERATOR,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    updatedAt: new Date('2026-10-01T12:00:00.000Z'),
    ...override,
  };
}

/**
 * Implementação em memória do contrato público UserDirectory, para testar
 * outros contextos sem depender da implementação de Identidade e Acesso.
 */
export class UserDirectoryMock implements UserDirectory {
  private readonly users = new Map<string, UserSummary>();

  constructor(users: UserSummary[] = []) {
    for (const user of users) {
      this.users.set(user.id, user);
    }
  }

  async findById(id: string): Promise<UserSummary | null> {
    return this.users.get(id) ?? null;
  }

  async findByIds(ids: readonly string[]): Promise<UserSummary[]> {
    return [...new Set(ids)].flatMap((id) => this.users.get(id) ?? []);
  }
}
