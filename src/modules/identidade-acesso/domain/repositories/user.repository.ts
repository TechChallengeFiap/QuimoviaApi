import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';

export interface UserSearchFilters {
  role?: UserRole;
  status?: UserStatus;
  page: number;
  pageSize: number;
}

export interface UserPage {
  items: User[];
  total: number;
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
  findByEmail(email: string): Promise<User | null>;
  list(filters: UserSearchFilters): Promise<UserPage>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const USER_REPOSITORY = Symbol('UserRepository');
