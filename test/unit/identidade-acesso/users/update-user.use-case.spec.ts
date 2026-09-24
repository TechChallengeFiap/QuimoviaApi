import { UpdateUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/update-user.use-case.ts';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.ts';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('UpdateUserUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    users = new UserRepositoryMock();
    useCase = new UpdateUserUseCase(users, new PasswordHasherMock());
  });

  async function registerUser(email = 'maria@quimovia.com'): Promise<User> {
    const user = User.create({
      name: 'Maria Silva',
      email,
      passwordHash: 'hash:old',
      role: UserRole.PORT_OPERATOR,
    });

    return users.create(user);
  }

  it('lança erro quando o usuário não existe', async () => {
    await expect(useCase.execute('id-inexistente', { name: 'Novo Nome' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('atualiza nome, perfil e status', async () => {
    const user = await registerUser();

    const updated = await useCase.execute(user.id, {
      name: 'Maria Souza',
      role: UserRole.OPERATIONS_MANAGER,
      status: UserStatus.INACTIVE,
    });

    expect(updated.name).toBe('Maria Souza');
    expect(updated.role).toBe(UserRole.OPERATIONS_MANAGER);
    expect(updated.status).toBe(UserStatus.INACTIVE);
  });

  it('rejeita alterar para um e-mail já usado por outro usuário', async () => {
    await registerUser('taken@quimovia.com');
    const user = await registerUser('free@quimovia.com');

    await expect(useCase.execute(user.id, { email: 'taken@quimovia.com' })).rejects.toThrow(
      ConflictError,
    );
  });

  it('desbloqueia corretamente ao pedir status ACTIVE para um usuário bloqueado', async () => {
    const user = await registerUser();
    user.block();
    await users.update(user);

    const updated = await useCase.execute(user.id, { status: UserStatus.ACTIVE });

    expect(updated.status).toBe(UserStatus.ACTIVE);
  });
});
