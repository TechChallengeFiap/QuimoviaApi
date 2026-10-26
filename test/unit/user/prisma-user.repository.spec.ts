import { jest } from '@jest/globals';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { PrismaUserRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-user.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

type PrismaMethod = (args: unknown) => Promise<unknown>;

/** Substitui o PrismaService, já que os testes não acessam o banco. */
function createPrismaFake() {
  return {
    user: {
      updateMany: jest.fn<PrismaMethod>(),
      findMany: jest.fn<PrismaMethod>(),
    },
  };
}

describe('PrismaUserRepository', () => {
  let prisma: ReturnType<typeof createPrismaFake>;
  let repository: PrismaUserRepository;

  beforeEach(() => {
    prisma = createPrismaFake();
    repository = new PrismaUserRepository(prisma as unknown as PrismaService);
  });

  function loggedInUser(): User {
    const user = User.create({
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      passwordHash: 'hash:S3nhaForte!',
      role: UserRole.PORT_OPERATOR,
    });
    user.registerLogin(new Date('2026-10-07T12:00:00.000Z'));

    return user;
  }

  it('grava só o horário do login, e só se o usuário ainda estiver ativo', async () => {
    const user = loggedInUser();
    prisma.user.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(repository.registerLogin(user)).resolves.toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: user.id, status: UserStatus.ACTIVE },
      data: { lastLoginAt: new Date('2026-10-07T12:00:00.000Z') },
    });
  });

  it('informa quando o usuário deixou de estar ativo antes da gravação', async () => {
    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(repository.registerLogin(loggedInUser())).resolves.toBe(false);
  });

  it('busca usuários em lote sem consultas individuais', async () => {
    const user = loggedInUser();
    prisma.user.findMany.mockResolvedValue([user.toObject()]);
    const found = await repository.findByIds([user.id]);
    expect(found.map((item) => item.toObject())).toEqual([user.toObject()]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [user.id] } },
    });
  });
});
