import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

export interface CreateLotInput {
  lotNumber: string;
  quantity: number;
}

/**
 * Registra o recebimento de um lote de um produto químico.
 *
 * Apenas produtos ativos podem ser utilizados em novas operações, portanto só
 * eles recebem lotes. O número do lote é único dentro do produto.
 */
@Injectable()
export class CreateLotUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(LOT_REPOSITORY) private readonly lots: LotRepository,
  ) {}

  async execute(chemicalProductId: string, input: CreateLotInput): Promise<Lot> {
    const product = await this.products.findById(chemicalProductId);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', chemicalProductId);
    }

    if (!product.canBeUsedInOperations()) {
      throw new BusinessRuleError(
        `Apenas produtos ativos podem receber lotes; o produto "${product.code}" está ${product.status}.`,
      );
    }

    const lotNumber = input.lotNumber.trim().toUpperCase();
    const existing = await this.lots.findByProductAndLotNumber(product.id, lotNumber);

    if (existing) {
      throw new ConflictError(
        `Já existe o lote "${lotNumber}" registrado para o produto "${product.code}".`,
      );
    }

    const lot = Lot.create({
      chemicalProductId: product.id,
      lotNumber,
      quantity: input.quantity,
    });

    return this.lots.create(lot);
  }
}
