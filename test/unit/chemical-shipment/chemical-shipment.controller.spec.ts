import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.js';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { ListChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/list-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';

describe('ChemicalShipmentController', () => {
  let controller: ChemicalShipmentController;
  let createUseCase: jest.Mocked<CreateChemicalShipmentUseCase>;
  let listUseCase: jest.Mocked<ListChemicalShipmentUseCase>;
  let findByIdUseCase: jest.Mocked<FindChemicalShipmentByIdUseCase>;
  let updateUseCase: jest.Mocked<UpdateChemicalShipmentUseCase>;
  let deleteUseCase: jest.Mocked<DeleteChemicalShipmentUseCase>;

  const mockShipment = ChemicalShipment.create({
    productId: 'prod-001',
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
    quantityProduct: 100,
  });

  beforeEach(async () => {
    createUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateChemicalShipmentUseCase>;

    listUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListChemicalShipmentUseCase>;

    findByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindChemicalShipmentByIdUseCase>;

    updateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateChemicalShipmentUseCase>;

    deleteUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteChemicalShipmentUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChemicalShipmentController],
      providers: [
        { provide: CreateChemicalShipmentUseCase, useValue: createUseCase },
        { provide: ListChemicalShipmentUseCase, useValue: listUseCase },
        { provide: FindChemicalShipmentByIdUseCase, useValue: findByIdUseCase },
        { provide: UpdateChemicalShipmentUseCase, useValue: updateUseCase },
        { provide: DeleteChemicalShipmentUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<ChemicalShipmentController>(
      ChemicalShipmentController,
    );
  });

  describe('createChemicalShipment', () => {
    it('deve cadastrar uma carga química com sucesso', async () => {
      createUseCase.execute.mockResolvedValue(mockShipment);

      const result = await controller.createChemicalShipment({
        productId: 'prod-001',
        quantityProduct: 100,
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
      });

      expect(result.id).toBe(mockShipment.id);
      expect(result.productId).toBe('prod-001');
    });

    it('deve repassar BadRequestException sem mascarar', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      await expect(
        controller.createChemicalShipment({
          productId: '',
          quantityProduct: 100,
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve repassar ResourceNotFoundError para ser tratado pelo filtro de domínio quando o usuário não existir', async () => {
      createUseCase.execute.mockRejectedValue(
        new ResourceNotFoundError('Usuário', 'user-inexistente'),
      );

      await expect(
        controller.createChemicalShipment({
          productId: 'prod-001',
          quantityProduct: 100,
          responsibleUserId: 'user-inexistente',
          documentsIds: 'doc-001',
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('deve capturar erro inesperado e lançar InternalServerErrorException', async () => {
      createUseCase.execute.mockRejectedValue(
        new Error('Falha de conexão com banco'),
      );

      await expect(
        controller.createChemicalShipment({
          productId: 'prod-001',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('listChemicalShipments', () => {
    it('deve listar cargas químicas com sucesso', async () => {
      listUseCase.execute.mockResolvedValue({
        items: [mockShipment],
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.listChemicalShipments({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve incluir responsibleUser na listagem se presente na entidade', async () => {
      const user = User.create({
        name: 'Carlos Oliveira',
        email: 'carlos@quimovia.com',
        passwordHash: 'hash123',
        role: UserRole.PORT_OPERATOR,
      });

      const shipmentWithUser = ChemicalShipment.restore({
        id: 'ship-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        status: StatusShipment.ANALYZING,
        productId: 'prod-001',
        responsibleUserId: user.id,
        responsibleUser: user,
        documentsIds: 'doc-001',
      });

      listUseCase.execute.mockResolvedValue({
        items: [shipmentWithUser],
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.listChemicalShipments({});
      expect(result.items[0].responsibleUser).toBeDefined();
      expect(result.items[0].responsibleUser?.name).toBe('Carlos Oliveira');
    });

    it('deve capturar erro inesperado na listagem e lançar InternalServerErrorException', async () => {
      listUseCase.execute.mockRejectedValue(new Error('Crash na query'));

      await expect(controller.listChemicalShipments({})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findChemicalShipmentById', () => {
    it('deve retornar a carga química pelo ID', async () => {
      findByIdUseCase.execute.mockResolvedValue(mockShipment);

      const result = await controller.findChemicalShipmentById(mockShipment.id);

      expect(result.id).toBe(mockShipment.id);
    });

    it('deve repassar ResourceNotFoundError para ser tratado pelo filtro de domínio', async () => {
      findByIdUseCase.execute.mockRejectedValue(
        new ResourceNotFoundError('Carga Química', 'inexistente'),
      );

      await expect(
        controller.findChemicalShipmentById('inexistente'),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('deve capturar erro inesperado na busca por ID e lançar InternalServerErrorException', async () => {
      findByIdUseCase.execute.mockRejectedValue(
        new Error('Erro interno não tratado'),
      );

      await expect(
        controller.findChemicalShipmentById('id-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateChemicalShipment', () => {
    it('deve atualizar a carga química com sucesso', async () => {
      updateUseCase.execute.mockResolvedValue(mockShipment);

      const result = await controller.updateChemicalShipment(mockShipment.id, {
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
      });

      expect(result.id).toBe(mockShipment.id);
    });

    it('deve repassar BadRequestException sem mascarar', async () => {
      updateUseCase.execute.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      await expect(
        controller.updateChemicalShipment(mockShipment.id, {
          productId: '',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve repassar ResourceNotFoundError para ser tratado pelo filtro de domínio quando usuário ou carga não existirem', async () => {
      updateUseCase.execute.mockRejectedValue(
        new ResourceNotFoundError('Usuário', 'user-inexistente'),
      );

      await expect(
        controller.updateChemicalShipment(mockShipment.id, {
          responsibleUserId: 'user-inexistente',
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('deve capturar erro inesperado e lançar InternalServerErrorException', async () => {
      updateUseCase.execute.mockRejectedValue(
        new Error('Falha de conexão com banco'),
      );

      await expect(
        controller.updateChemicalShipment(mockShipment.id, {
          productId: 'prod-001',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteChemicalShipment', () => {
    it('deve deletar a carga química com sucesso', async () => {
      deleteUseCase.execute.mockResolvedValue();

      const result = await controller.deleteChemicalShipment(mockShipment.id);

      expect(result).toBeUndefined();
    });

    it('deve repassar BadRequestException sem mascarar', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      await expect(
        controller.deleteChemicalShipment(mockShipment.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve capturar erro inesperado e lançar InternalServerErrorException', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new Error('Falha de conexão com banco'),
      );

      await expect(
        controller.deleteChemicalShipment(mockShipment.id),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
