import { jest } from '@jest/globals';
import { UserDirectoryService } from '@/modules/user/application/services/user-directory.service.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';

function createUser(id: string, email: string): User {
  return User.restore({
    id,
    name: 'Maria Silva',
    email,
    passwordHash: 'hash:S3nhaForte!',
    role: UserRole.PORT_OPERATOR,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    updatedAt: new Date('2026-10-01T12:00:00.000Z'),
  });
}

describe('UserDirectoryService', () => {
  let users: UserRepositoryMock;
  let directory: UserDirectoryService;

  beforeEach(async () => {
    users = new UserRepositoryMock();
    directory = new UserDirectoryService(users);

    await users.create(createUser('user-001', 'maria@quimovia.com'));
    await users.create(createUser('user-002', 'joao@quimovia.com'));
  });

  it('devolve o resumo do usuário, sem o hash da senha', async () => {
    const summary = await directory.findById('user-001');

    expect(summary).toEqual({
      id: 'user-001',
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      role: UserRole.PORT_OPERATOR,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date('2026-10-01T12:00:00.000Z'),
      updatedAt: new Date('2026-10-01T12:00:00.000Z'),
    });
    expect(summary).not.toHaveProperty('passwordHash');
  });

  it('devolve null quando o usuário não existe', async () => {
    await expect(directory.findById('user-inexistente')).resolves.toBeNull();
  });

  it('busca vários usuários de uma vez, sem repetir e ignorando os inexistentes', async () => {
    const findManyByIds = jest.spyOn(users, 'findManyByIds');

    const summaries = await directory.findByIds([
      'user-001',
      'user-002',
      'user-001',
      'user-inexistente',
    ]);

    expect(findManyByIds).toHaveBeenCalledWith([
      'user-001',
      'user-002',
      'user-inexistente',
    ]);
    expect(summaries.map((summary) => summary.id).sort()).toEqual([
      'user-001',
      'user-002',
    ]);
  });

  it('não consulta o repositório quando nenhum identificador é informado', async () => {
    const findManyByIds = jest.spyOn(users, 'findManyByIds');

    await expect(directory.findByIds([])).resolves.toEqual([]);
    expect(findManyByIds).not.toHaveBeenCalled();
  });
});
