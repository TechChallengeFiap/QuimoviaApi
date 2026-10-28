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
      update: jest.fn<PrismaMethod>(),
      updateMany: jest.fn<PrismaMethod>(),
      findUnique: jest.fn<PrismaMethod>(),
      findMany: jest.fn<PrismaMethod>(),
      count: jest.fn<PrismaMethod>(),
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
      where: { id: user.id, status: UserStatus.ACTIVE, isDeleted: false },
      data: { lastLoginAt: new Date('2026-10-07T12:00:00.000Z') },
    });
  });

  it('informa quando o usuário deixou de estar ativo antes da gravação', async () => {
    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(repository.registerLogin(loggedInUser())).resolves.toBe(false);
  });

  it('busca usuários em lote e exclui registros com exclusão lógica', async () => {
    const user = loggedInUser();
    prisma.user.findMany.mockResolvedValue([
      { ...user.toObject(), isDeleted: false },
    ]);
    const found = await repository.findByIds([user.id]);
    expect(found.map((item) => item.toObject())).toEqual([user.toObject()]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [user.id] }, isDeleted: false },
    });
  });

  describe('exclusão lógica', () => {
    const record = {
      id: 'user-001',
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      passwordHash: 'hash:S3nhaForte!',
      role: UserRole.PORT_OPERATOR,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date('2026-10-01T12:00:00.000Z'),
      updatedAt: new Date('2026-10-02T12:00:00.000Z'),
      isDeleted: false,
      deletedAt: null,
    };

    it('ignora os usuários excluídos nas buscas por id e por e-mail', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(repository.findById('user-001')).resolves.toBeNull();
      await expect(
        repository.findByEmail('maria@quimovia.com'),
      ).resolves.toBeNull();
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-001', isDeleted: false },
      });
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: 'maria@quimovia.com', isDeleted: false },
      });
    });

    it('encontra o usuário excluído só na busca que os inclui', async () => {
      const deletedAt = new Date('2026-10-19T12:00:00.000Z');
      prisma.user.findUnique.mockResolvedValueOnce({
        ...record,
        isDeleted: true,
        deletedAt,
      });

      const user =
        await repository.findByEmailIncludingDeleted('maria@quimovia.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'maria@quimovia.com' },
      });
      expect(user?.isDeleted).toBe(true);
      expect(user?.deletedAt).toEqual(deletedAt);
    });

    it('usa a data da última alteração quando o registro excluído não tem a data da exclusão', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...record,
        isDeleted: true,
      });

      const user =
        await repository.findByEmailIncludingDeleted('maria@quimovia.com');

      expect(user?.deletedAt).toEqual(record.updatedAt);
    });

    it('deixa os usuários excluídos fora da listagem e da contagem', async () => {
      prisma.user.findMany.mockResolvedValueOnce([record]);
      prisma.user.count.mockResolvedValueOnce(1);

      const page = await repository.list({
        role: UserRole.PORT_OPERATOR,
        page: 1,
        pageSize: 20,
      });

      const where = { isDeleted: false, role: UserRole.PORT_OPERATOR };
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({ where });
      expect(page.total).toBe(1);
    });

    it('grava a exclusão nas colunas isDeleted e deletedAt', async () => {
      const user = loggedInUser();
      const deletedAt = new Date('2026-10-19T12:00:00.000Z');
      user.delete(deletedAt);
      prisma.user.update.mockResolvedValueOnce({
        ...record,
        isDeleted: true,
        deletedAt,
      });

      await repository.update(user);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({ isDeleted: true, deletedAt }),
      });
    });
  });
});
