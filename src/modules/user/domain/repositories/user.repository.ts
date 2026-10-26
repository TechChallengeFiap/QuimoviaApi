import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

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
 *
 * A exclusão é lógica e gravada pelo update(). As buscas e a listagem ignoram
 * os usuários excluídos; só findByEmailIncludingDeleted() os encontra.
 */
export interface UserRepository {
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /**
   * Busca pelo e-mail incluindo os usuários excluídos, cujo e-mail continua
   * reservado: um novo cadastro com ele reativa o registro excluído.
   */
  findByEmailIncludingDeleted(email: string): Promise<User | null>;
  /**
   * Registra o horário do último login sem regravar os demais dados, e só se o
   * usuário ainda estiver ativo e não excluído. Retorna false quando ele deixou
   * de estar ativo enquanto o login acontecia (por exemplo, foi bloqueado ou
   * excluído nesse intervalo).
   */
  registerLogin(user: User): Promise<boolean>;
  list(filters: UserSearchFilters): Promise<UserPage>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const USER_REPOSITORY = Symbol('UserRepository');
