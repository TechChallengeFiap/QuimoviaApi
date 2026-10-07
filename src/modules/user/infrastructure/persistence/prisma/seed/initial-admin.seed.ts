import type { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export const DEFAULT_ADMIN_NAME = 'Administrador do Sistema';

/** Mesmo tamanho mínimo de senha exigido no cadastro pela API. */
export const MIN_ADMIN_PASSWORD_LENGTH = 8;

export interface InitialAdminConfig {
  name: string;
  email: string;
  password: string;
}

export interface InitialAdminSeedResult {
  created: boolean;
  user: User;
}

/** Lê e valida os dados do administrador inicial nas variáveis de ambiente. */
export function loadInitialAdminConfig(
  env: NodeJS.ProcessEnv = process.env,
): InitialAdminConfig {
  const email = env.ADMIN_EMAIL?.trim() ?? '';
  const password = env.ADMIN_PASSWORD ?? '';

  if (email.length === 0) {
    throw new Error(
      'A variável de ambiente ADMIN_EMAIL é obrigatória para criar o administrador inicial.',
    );
  }

  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `A variável de ambiente ADMIN_PASSWORD é obrigatória e deve ter ao menos ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  return {
    name: env.ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME,
    email,
    password,
  };
}

/**
 * Garante o primeiro Administrador do Sistema. Como todas as rotas exigem
 * login e só o administrador cadastra usuários (RN-ACE-04), sem ele um banco
 * novo não teria como receber o primeiro acesso.
 *
 * Pode ser executado mais de uma vez: se o e-mail já estiver cadastrado, o
 * usuário existente é mantido como está.
 */
export async function seedInitialAdmin(
  users: UserRepository,
  createUserUseCase: CreateUserUseCase,
  config: InitialAdminConfig,
): Promise<InitialAdminSeedResult> {
  const existing = await users.findByEmail(config.email.toLowerCase());

  if (existing) {
    return { created: false, user: existing };
  }

  const user = await createUserUseCase.execute({
    name: config.name,
    email: config.email,
    password: config.password,
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
  });

  return { created: true, user };
}
