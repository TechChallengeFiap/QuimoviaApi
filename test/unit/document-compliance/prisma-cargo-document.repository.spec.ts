import { jest } from '@jest/globals';
import { Prisma } from '@/generated/prisma/client.js';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { PrismaCargoDocumentRepository } from '@/modules/document-compliance/infrastructure/persistence/prisma/prisma-cargo-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import {
  createAttachmentData,
  createCargoDocumentData,
} from '../../mocks/cargo-document.fixture.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Falha simulada', {
    code,
    clientVersion: '7.10.0',
  });

describe('PrismaCargoDocumentRepository', () => {
  const delegate = {
    create: jest.fn<(args: unknown) => Promise<unknown>>(),
    update: jest.fn<(args: unknown) => Promise<unknown>>(),
    delete: jest.fn<(args: unknown) => Promise<unknown>>(),
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
    count: jest.fn<(args: unknown) => Promise<unknown>>(),
  };
  const repository = new PrismaCargoDocumentRepository({
    cargoDocument: delegate,
  } as unknown as PrismaService);
  let document: CargoDocument;

  beforeEach(() => {
    jest.resetAllMocks();
    document = CargoDocument.create(createCargoDocumentData());
  });

  it('cria a raiz e os anexos na mesma gravação e reconstrói o domínio', async () => {
    delegate.create.mockResolvedValue(document.toObject());
    expect((await repository.create(document)).toObject()).toEqual(
      document.toObject(),
    );
    expect(delegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cargoId: document.cargoId,
          attachments: { create: document.attachments },
        }),
      }),
    );
  });

  it('converte violação de unicidade em conflito, inclusive em criação concorrente', async () => {
    delegate.create.mockRejectedValue(prismaError('P2002'));
    await expect(repository.create(document)).rejects.toThrow(ConflictError);
  });

  it('não mascara falhas de infraestrutura como erros de negócio', async () => {
    const failure = new Error('Conexão indisponível');
    delegate.create.mockRejectedValue(failure);
    delegate.update.mockRejectedValue(failure);
    delegate.delete.mockRejectedValue(failure);
    await expect(repository.create(document)).rejects.toBe(failure);
    await expect(repository.update(document)).rejects.toBe(failure);
    await expect(repository.remove(document.id, 0)).rejects.toBe(failure);
  });

  it('protege a gravação por revisão e estado e não sobrescreve o conteúdo de anexos existentes', async () => {
    document.revise({
      attachments: [
        createAttachmentData({
          replacesAttachmentId: document.attachments[0].id,
        }),
      ],
    });
    delegate.update.mockResolvedValue({ ...document.toObject(), revision: 1 });
    const updated = await repository.update(document);
    expect(updated.revision).toBe(1);
    expect(delegate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: document.id,
          revision: 0,
          status: CargoDocumentStatus.PENDING,
          submittedAt: null,
        },
        data: {
          revision: { increment: 1 },
          attachments: {
            upsert: document.attachments.map((attachment) => ({
              where: { id: attachment.id },
              create: attachment,
              update: {
                removedAt: attachment.removedAt,
                updatedAt: attachment.updatedAt,
              },
            })),
          },
        },
      }),
    );
  });

  it('protege a exclusão pelo mesmo estado e revisão', async () => {
    delegate.delete.mockResolvedValue(document.toObject());
    await repository.remove(document.id, 3);
    expect(delegate.delete).toHaveBeenCalledWith({
      where: {
        id: document.id,
        revision: 3,
        status: 'PENDING',
        submittedAt: null,
      },
    });
  });

  it.each(['update', 'delete'] as const)(
    'retorna 404 se o recurso desaparecer durante %s',
    async (operation) => {
      delegate[operation].mockRejectedValue(prismaError('P2025'));
      delegate.findUnique.mockResolvedValue(null);
      await expect(
        operation === 'update'
          ? repository.update(document)
          : repository.remove(document.id, 0),
      ).rejects.toThrow(ResourceNotFoundError);
    },
  );

  it.each(['update', 'delete'] as const)(
    'retorna 409 se uma mudança concorrente impedir %s',
    async (operation) => {
      delegate[operation].mockRejectedValue(prismaError('P2025'));
      delegate.findUnique.mockResolvedValue({ id: document.id });
      await expect(
        operation === 'update'
          ? repository.update(document)
          : repository.remove(document.id, 0),
      ).rejects.toThrow(ConflictError);
    },
  );

  it('consulta por identificador ou carga e representa ausência com null', async () => {
    delegate.findUnique
      .mockResolvedValueOnce(document.toObject())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(document.toObject())
      .mockResolvedValueOnce(null);
    expect((await repository.findById(document.id))?.id).toBe(document.id);
    expect(await repository.findById(document.id)).toBeNull();
    expect((await repository.findByCargoId(document.cargoId))?.id).toBe(
      document.id,
    );
    expect(await repository.findByCargoId(document.cargoId)).toBeNull();
  });

  it('usa os mesmos filtros na página e contagem com ordenação determinística', async () => {
    delegate.findMany.mockResolvedValue([document.toObject()]);
    delegate.count.mockResolvedValue(12);
    const where = {
      cargoId: document.cargoId,
      shipperId: document.shipperId,
      status: CargoDocumentStatus.PENDING,
    };
    const page = await repository.list({ ...where, page: 3, pageSize: 5 });
    expect(page).toMatchObject({ total: 12, page: 3, pageSize: 5 });
    expect(page.items[0].toObject()).toEqual(document.toObject());
    expect(delegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 10,
        take: 5,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(delegate.count).toHaveBeenCalledWith({ where });
  });
});
