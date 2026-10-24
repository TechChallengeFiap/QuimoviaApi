import { jest } from '@jest/globals';
import { Prisma } from '@/generated/prisma/client.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { PrismaShipmentDocumentRepository } from '@/modules/document-compliance/infrastructure/persistence/prisma/prisma-shipment-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
} from '../../mocks/shipment-document.fixture.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Falha simulada', {
    code,
    clientVersion: '7.10.0',
  });

describe('PrismaShipmentDocumentRepository', () => {
  const delegate = {
    create: jest.fn<(args: unknown) => Promise<unknown>>(),
    update: jest.fn<(args: unknown) => Promise<unknown>>(),
    delete: jest.fn<(args: unknown) => Promise<unknown>>(),
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
    count: jest.fn<(args: unknown) => Promise<unknown>>(),
  };
  const repository = new PrismaShipmentDocumentRepository({
    shipmentDocument: delegate,
  } as unknown as PrismaService);
  let document: ShipmentDocument;

  const persistedRecord = () => ({
    ...document.toObject(),
    attachments: document.attachments.map((attachment) => ({
      ...attachment,
      scopes: [{ type: 'CARGO' }] as { type: string; cargoItemId?: string }[],
    })),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    document = ShipmentDocument.create(createShipmentDocumentData());
  });

  it('cria a raiz e os anexos na mesma gravação e reconstrói o domínio', async () => {
    delegate.create.mockResolvedValue(persistedRecord());
    expect((await repository.create(document)).toObject()).toEqual(
      document.toObject(),
    );
    expect(delegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shipmentId: document.shipmentId,
          attachments: { create: persistedRecord().attachments },
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
    delegate.update.mockResolvedValue({ ...persistedRecord(), revision: 1 });
    const updated = await repository.update(document);
    expect(updated.revision).toBe(1);
    expect(delegate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: document.id,
          revision: 0,
          status: ShipmentDocumentStatus.PENDING,
          submittedAt: null,
        },
        data: {
          revision: { increment: 1 },
          responsibleUserId: document.responsibleUserId,
          attachments: {
            upsert: document.attachments.map((attachment) => ({
              where: { id: attachment.id },
              create: { ...attachment, scopes: [{ type: 'CARGO' }] },
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
    delegate.delete.mockResolvedValue(persistedRecord());
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
      .mockResolvedValueOnce(persistedRecord())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(persistedRecord())
      .mockResolvedValueOnce(null);
    expect((await repository.findById(document.id))?.id).toBe(document.id);
    expect(await repository.findById(document.id)).toBeNull();
    expect((await repository.findByShipmentId(document.shipmentId))?.id).toBe(
      document.id,
    );
    expect(await repository.findByShipmentId(document.shipmentId)).toBeNull();
  });

  it('usa os mesmos filtros na página e contagem com ordenação determinística', async () => {
    delegate.findMany.mockResolvedValue([persistedRecord()]);
    delegate.count.mockResolvedValue(12);
    const where = {
      shipmentId: document.shipmentId,
      shipperId: document.shipperId,
      status: ShipmentDocumentStatus.PENDING,
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
  it('maps persisted shipment and item scopes without changing stored JSON', async () => {
    const itemId = 'c4c68724-2ba9-4f4f-b38d-e8b7131eeae7';
    const record = persistedRecord();
    record.attachments[0].scopes = [
      { type: 'CARGO' },
      { type: 'CARGO_ITEM', cargoItemId: itemId },
    ];
    delegate.findUnique.mockResolvedValue(record);
    const restored = await repository.findById(document.id);
    expect(restored?.attachments[0].scopes).toEqual([
      { type: 'SHIPMENT' },
      { type: 'SHIPMENT_ITEM', shipmentItemId: itemId },
    ]);
    delegate.create.mockResolvedValue(record);
    await repository.create(restored!);
    expect(delegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachments: { create: record.attachments },
        }),
      }),
    );
  });

  it('persists the responsible user foreign key on create and update', async () => {
    document = ShipmentDocument.create(
      createShipmentDocumentData({
        responsibleUserId: 'bb113c8c-b2bf-49b5-8d6b-b456c49aca5d',
      }),
    );
    delegate.create.mockResolvedValue(persistedRecord());
    delegate.update.mockResolvedValue(persistedRecord());
    await repository.create(document);
    await repository.update(document);
    for (const operation of ['create', 'update'] as const) {
      expect(delegate[operation]).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            responsibleUserId: document.responsibleUserId,
          }),
        }),
      );
    }
  });

  it('loads only the responsible user identifier and name for reads and lists', async () => {
    const user = {
      id: 'bb113c8c-b2bf-49b5-8d6b-b456c49aca5d',
      name: 'Maria Silva',
      passwordHash: 'must-not-leak',
      email: 'internal@example.com',
      token: 'must-not-leak',
    };
    const record = {
      ...persistedRecord(),
      responsibleUserId: user.id,
      responsibleUser: user,
    };
    delegate.findUnique.mockResolvedValue(record);
    delegate.findMany.mockResolvedValue([record]);
    delegate.count.mockResolvedValue(1);
    const found = await repository.findById(document.id);
    const byShipment = await repository.findByShipmentId(document.shipmentId);
    const page = await repository.list({ page: 1, pageSize: 20 });
    for (const item of [found, byShipment, page.items[0]]) {
      expect(item?.responsibleUser).toEqual({ id: user.id, name: user.name });
      expect(item?.toObject().responsibleUser).toEqual({
        id: user.id,
        name: user.name,
      });
    }
    const include = expect.objectContaining({
      responsibleUser: { select: { id: true, name: true } },
    });
    expect(delegate.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ include }),
    );
    expect(delegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include }),
    );
  });

  it.each(['create', 'update'] as const)(
    'handles a responsible user removed concurrently during %s',
    async (operation) => {
      document = ShipmentDocument.create(
        createShipmentDocumentData({
          responsibleUserId: 'bb113c8c-b2bf-49b5-8d6b-b456c49aca5d',
        }),
      );
      delegate[operation].mockRejectedValue(prismaError('P2003'));
      await expect(repository[operation](document)).rejects.toThrow(
        ResourceNotFoundError,
      );
    },
  );
});
