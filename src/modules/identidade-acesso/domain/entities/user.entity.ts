import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';

const MIN_NAME_LENGTH = 3;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProperties {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: UserStatus;
}

/**
 * Raiz do agregado Usuário.
 *
 * Concentra as invariantes do cadastro e do controle de acesso: nenhum atributo
 * é alterado sem passar por um de seus métodos. A unicidade do e-mail é a única
 * regra que a entidade não consegue garantir sozinha — ela depende do
 * repositório, que consulta o conjunto completo de usuários.
 */
export class User {
  readonly id: string;
  readonly createdAt: Date;

  #name: string;
  #email: string;
  #passwordHash: string;
  #role: UserRole;
  #status: UserStatus;
  #lastLoginAt: Date | null;
  #updatedAt: Date;

  private constructor(properties: UserProperties) {
    this.id = properties.id;
    this.createdAt = properties.createdAt;
    this.#name = properties.name;
    this.#email = properties.email;
    this.#passwordHash = properties.passwordHash;
    this.#role = properties.role;
    this.#status = properties.status;
    this.#lastLoginAt = properties.lastLoginAt;
    this.#updatedAt = properties.updatedAt;
  }

  /** Cria um novo usuário, validando os dados informados. */
  static create(data: CreateUserData): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      name: User.validateName(data.name),
      email: User.validateEmail(data.email),
      passwordHash: User.validatePasswordHash(data.passwordHash),
      role: data.role,
      status: data.status ?? UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstrói um usuário já persistido, sem revalidar os dados. */
  static restore(properties: UserProperties): User {
    return new User(properties);
  }

  get name(): string {
    return this.#name;
  }

  get email(): string {
    return this.#email;
  }

  get passwordHash(): string {
    return this.#passwordHash;
  }

  get role(): UserRole {
    return this.#role;
  }

  get status(): UserStatus {
    return this.#status;
  }

  get lastLoginAt(): Date | null {
    return this.#lastLoginAt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  rename(name: string): void {
    this.#name = User.validateName(name);
    this.markAsUpdated();
  }

  changeEmail(email: string): void {
    this.#email = User.validateEmail(email);
    this.markAsUpdated();
  }

  changePassword(passwordHash: string): void {
    this.#passwordHash = User.validatePasswordHash(passwordHash);
    this.markAsUpdated();
  }

  changeRole(role: UserRole): void {
    this.#role = role;
    this.markAsUpdated();
  }

  /**
   * Um usuário bloqueado não volta a ser ativo automaticamente: o desbloqueio
   * é uma decisão explícita do Administrador do Sistema.
   */
  activate(): void {
    if (this.#status === UserStatus.BLOCKED) {
      throw new BusinessRuleError(
        'Um usuário bloqueado não pode ser ativado diretamente; é necessário desbloqueá-lo.',
      );
    }

    this.changeStatus(UserStatus.ACTIVE);
  }

  deactivate(): void {
    this.changeStatus(UserStatus.INACTIVE);
  }

  block(): void {
    this.changeStatus(UserStatus.BLOCKED);
  }

  unblock(): void {
    if (this.#status !== UserStatus.BLOCKED) {
      throw new BusinessRuleError(
        'Apenas um usuário bloqueado pode ser desbloqueado.',
      );
    }

    this.changeStatus(UserStatus.ACTIVE);
  }

  /** Somente um usuário ativo pode autenticar-se e abrir novas sessões. */
  canAuthenticate(): boolean {
    return this.#status === UserStatus.ACTIVE;
  }

  registerLogin(at: Date = new Date()): void {
    if (!this.canAuthenticate()) {
      throw new BusinessRuleError(
        `Usuário com status ${this.#status} não pode autenticar-se no sistema.`,
      );
    }

    this.#lastLoginAt = at;
    this.markAsUpdated();
  }

  toObject(): UserProperties {
    return {
      id: this.id,
      name: this.#name,
      email: this.#email,
      passwordHash: this.#passwordHash,
      role: this.#role,
      status: this.#status,
      lastLoginAt: this.#lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
    };
  }

  private changeStatus(status: UserStatus): void {
    if (this.#status === status) {
      return;
    }

    this.#status = status;
    this.markAsUpdated();
  }

  private markAsUpdated(): void {
    this.#updatedAt = new Date();
  }

  private static validateName(name: string): string {
    const normalizedName = name.trim();

    if (normalizedName.length < MIN_NAME_LENGTH) {
      throw new BusinessRuleError(
        `O nome do usuário deve ter ao menos ${MIN_NAME_LENGTH} caracteres.`,
      );
    }

    return normalizedName;
  }

  private static validateEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_FORMAT.test(normalizedEmail)) {
      throw new BusinessRuleError(`O e-mail "${email}" não é válido.`);
    }

    return normalizedEmail;
  }

  private static validatePasswordHash(passwordHash: string): string {
    if (passwordHash.trim().length === 0) {
      throw new BusinessRuleError(
        'O hash da senha do usuário não pode ser vazio.',
      );
    }

    return passwordHash;
  }
}
