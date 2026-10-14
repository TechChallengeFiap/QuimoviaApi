import { jest } from '@jest/globals';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { PrismaSessionRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-session.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { buildSession } from '../../mocks/entities.mock.js';

type PrismaMethod = (args: unknown) => Promise<unknown>;

/** Substitui o PrismaService, já que os testes não acessam o banco. */
function createPrismaFake() {
  return {
    session: {
      create: jest.fn<PrismaMethod>(),
      update: jest.fn<PrismaMethod>(),
      findUnique: jest.fn<PrismaMethod>(),
      updateMany: jest.fn<PrismaMethod>(),
    },
  };
}

const persisted = {
  id: 'session-001',
  userId: 'user-001',
  createdAt: new Date('2026-10-07T12:00:00.000Z'),
  expiresAt: new Date('2026-10-07T13:00:00.000Z'),
  endedAt: null,
};

describe('PrismaSessionRepository', () => {
  let prisma: ReturnType<typeof createPrismaFake>;
  let repository: PrismaSessionRepository;

  beforeEach(() => {
    prisma = createPrismaFake();
    repository = new PrismaSessionRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('grava a sessão com o usuário, o início e o prazo', async () => {
    const session = buildSession({ startedAt: persisted.createdAt });
    prisma.session.create.mockResolvedValueOnce({
      ...persisted,
      id: session.id,
    });

    const created = await repository.create(session);

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        id: session.id,
        userId: 'user-001',
        createdAt: persisted.createdAt,
        expiresAt: persisted.expiresAt,
        endedAt: null,
      },
    });
    expect(created.toObject()).toEqual({ ...persisted, id: session.id });
  });

  it('atualiza apenas o encerramento da sessão', async () => {
    const endedAt = new Date('2026-10-07T12:30:00.000Z');
    const session = Session.restore(persisted);
    session.end(endedAt);
    prisma.session.update.mockResolvedValueOnce({ ...persisted, endedAt });

    const updated = await repository.update(session);

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-001' },
      data: { endedAt },
    });
    expect(updated.endedAt).toEqual(endedAt);
  });

  it('busca a sessão pelo id e retorna null quando ela não existe', async () => {
    prisma.session.findUnique
      .mockResolvedValueOnce(persisted)
      .mockResolvedValueOnce(null);

    const found = await repository.findById('session-001');
    const missing = await repository.findById('session-inexistente');

    expect(prisma.session.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'session-001' },
    });
    expect(found?.toObject()).toEqual(persisted);
    expect(missing).toBeNull();
  });

  it('encerra só as sessões do usuário que ainda estão abertas', async () => {
    const endedAt = new Date('2026-10-07T12:30:00.000Z');
    prisma.session.updateMany.mockResolvedValueOnce({ count: 2 });

    const count = await repository.endAllByUserId('user-001', endedAt);

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-001', endedAt: null },
      data: { endedAt },
    });
    expect(count).toBe(2);
  });
});
