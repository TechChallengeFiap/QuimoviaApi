import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type { Page } from '@/shared/domain/pagination.js';

export interface UserSearchFilters {
  role?: UserRole;
  status?: UserStatus;
  page: number;
  pageSize: number;
}

/**
 * Porta de persistência do agregado Usuário.
 *
 * A camada de aplicação depende apenas desta interface; a implementação
 * concreta (Prisma) vive na camada de infraestrutura.
 */
export interface UserRepository {
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<User | null>;
  /** Busca de uma vez vários usuários; identificadores inexistentes são ignorados. */
  findManyByIds(ids: readonly string[]): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  /**
   * Registra o horário do último login sem regravar os demais dados, e só se o
   * usuário ainda estiver ativo. Retorna false quando ele deixou de estar ativo
   * enquanto o login acontecia (por exemplo, foi bloqueado nesse intervalo).
   */
  registerLogin(user: User): Promise<boolean>;
  list(filters: UserSearchFilters): Promise<Page<User>>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const USER_REPOSITORY = Symbol('UserRepository');
