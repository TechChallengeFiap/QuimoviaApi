import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';

export interface UpdateChemicalShipmentInput {
  status?: StatusShipment;
  productId?: string;
  responsibleUserId?: string;
  documentsIds?: string;
  quantityProduct?: number;
}

@Injectable()
export class UpdateChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly chemicalProducts: ChemicalProductRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateChemicalShipmentInput,
  ): Promise<ChemicalShipment> {
    const existingChemicalShipment = await this.chemicalShipments.findById(id);

    if (!existingChemicalShipment) {
      throw new ResourceNotFoundError('Carga Química', id);
    }

    if (input.status) {
      existingChemicalShipment.updateStatus(input.status);
    }

    if (input.productId) {
      const product = await this.chemicalProducts.findById(input.productId);
      if (!product) {
        throw new ResourceNotFoundError('Produto Químico', input.productId);
      }

      if (!product.canBeUsedInOperations()) {
        throw new BusinessRuleError(
          'Um produto químico inativo não pode ser associado a uma carga química',
        );
      }

      existingChemicalShipment.changeProduct(input.productId);
    }

    if (input.responsibleUserId) {
      const user = await this.users.findById(input.responsibleUserId);
      if (!user) {
        throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
      }

      existingChemicalShipment.changeResponsibleUser(input.responsibleUserId);
    }

    if (input.documentsIds) {
      existingChemicalShipment.changeDocuments(input.documentsIds);
    }

    if (input.quantityProduct !== undefined) {
      existingChemicalShipment.changeQuantityProduct(input.quantityProduct);
    }

    return await this.chemicalShipments.update(existingChemicalShipment);
  }
}
