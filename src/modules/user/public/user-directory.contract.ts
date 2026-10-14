import type { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import type { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

/**
 * Dados de um usuário que outros contextos podem conhecer.
 *
 * Nunca inclui o hash da senha nem as sessões: esses dados não saem do
 * contexto Identidade e Acesso.
 */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contrato publicado por Identidade e Acesso para que outros contextos
 * consultem usuários sem depender da entidade, do repositório ou do banco
 * deste contexto.
 *
 * Os consumidores injetam o contrato pelo token USER_DIRECTORY. Se este
 * contexto for extraído, basta registrar uma implementação remota para o
 * mesmo token.
 */
export interface UserDirectory {
  findById(id: string): Promise<UserSummary | null>;
  /**
   * Retorna os usuários encontrados entre os identificadores informados, sem
   * ordem definida; identificadores inexistentes são ignorados.
   */
  findByIds(ids: readonly string[]): Promise<UserSummary[]>;
}

export const USER_DIRECTORY = Symbol('UserDirectory');
