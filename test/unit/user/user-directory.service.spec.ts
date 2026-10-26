import { jest } from '@jest/globals';
import { UserDirectoryService } from '@/modules/user/application/services/user-directory.service.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';

describe('UserDirectoryService', () => {
  let users: UserRepositoryMock;
  let directory: UserDirectoryService;
  let user: User;

  beforeEach(async () => {
    users = new UserRepositoryMock();
    directory = new UserDirectoryService(users);
    user = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@example.com',
        passwordHash: 'internal-secret',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  });

  it('publica apenas identificador e nome, sem credenciais ou estado mutável', async () => {
    const summary = await directory.findById(user.id.toUpperCase());
    expect(summary).toEqual({ id: user.id, name: user.name });
    summary!.name = 'Alteração externa';
    expect((await directory.findById(user.id))!.name).toBe('Maria Silva');
    expect(await directory.findById('inexistente')).toBeNull();
  });

  it('normaliza e deduplica os identificadores em uma consulta em lote', async () => {
    const find = jest.spyOn(users, 'findByIds');
    const single = jest.spyOn(users, 'findById');
    expect(
      await directory.findByIds([
        user.id,
        user.id.toUpperCase(),
        'inexistente',
      ]),
    ).toEqual([{ id: user.id, name: user.name }]);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith([user.id, 'inexistente']);
    expect(single).not.toHaveBeenCalled();
  });

  it('evita consultas para uma lista vazia', async () => {
    const find = jest.spyOn(users, 'findByIds');
    expect(await directory.findByIds([])).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
