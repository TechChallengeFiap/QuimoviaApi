import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { ChemicalProductRepositoryMock } from '../../mocks/chemical-product-repository.mock.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { StatusShipment } from '@/generated/prisma/enums.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

describe('CreateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserRepositoryMock;
  let chemicalProducts: ChemicalProductRepositoryMock;
  let useCase: CreateChemicalShipmentUseCase;

  beforeEach(async () => {
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserRepositoryMock();
    chemicalProducts = new ChemicalProductRepositoryMock();
    useCase = new CreateChemicalShipmentUseCase(
      chemicalShipments,
      users,
      chemicalProducts,
    );

    await chemicalProducts.create(
      ChemicalProduct.restore({
        id: 'prod-001',
        code: 'PROD-001',
        technicalName: 'Ácido Clorídrico',
        tradeName: null,
        unNumber: '1789',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        status: ProductStatus.ACTIVE,
        responsibleUserId: 'user-001',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await users.create(
      User.restore({
        id: 'user-001',
        name: 'Operador Teste',
        email: 'operador@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('cria uma carga química com status inicial ANALYZING', async () => {
    const input = {
      productId: 'prod-001',
      quantityProduct: 100,
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    const chemicalShipment = await useCase.execute(input);

    expect(chemicalShipment.status).toBe(StatusShipment.ANALYZING);
    expect(chemicalShipment.quantityProduct).toBe(100);
    expect(
      await chemicalShipments.findById(chemicalShipment.id),
    ).not.toBeNull();
  });

  it('deve lançar ResourceNotFoundError quando o usuário responsável não existir', async () => {
    const input = {
      productId: 'prod-001',
      quantityProduct: 100,
      responsibleUserId: 'user-inexistente',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve lançar ResourceNotFoundError quando o produto químico não existir', async () => {
    const input = {
      productId: 'prod-inexistente',
      quantityProduct: 100,
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve lançar BusinessRuleError quando a quantidade do produto for igual a zero', async () => {
    const input = {
      productId: 'prod-001',
      quantityProduct: 0,
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(BusinessRuleError);
  });

  it('deve lançar BusinessRuleError quando a quantidade do produto for negativa', async () => {
    const input = {
      productId: 'prod-001',
      quantityProduct: -5,
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(BusinessRuleError);
  });

  it('deve lançar BusinessRuleError quando a quantidade do produto não for informada', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    } as any;

    await expect(useCase.execute(input)).rejects.toThrow(BusinessRuleError);
  });
});

