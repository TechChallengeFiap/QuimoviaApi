import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ConflictError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';

export interface UpdateChemicalProductInput {
  code?: string;
  technicalName?: string;
  tradeName?: string | null;
  unNumber?: string;
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
}

/**
 * Atualiza os dados cadastrais de um produto químico (Responsável Técnico).
 *
 * A alteração de status é um caso de uso à parte, de outro ator, e por isso
 * fica em ChangeChemicalProductStatusUseCase.
 */
@Injectable()
export class UpdateChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(id: string, input: UpdateChemicalProductInput): Promise<ChemicalProduct> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    if (input.code !== undefined) {
      await this.changeCode(product, input.code);
    }

    if (input.technicalName !== undefined) {
      product.changeTechnicalName(input.technicalName);
    }

    if (input.tradeName !== undefined) {
      product.changeTradeName(input.tradeName);
    }

    if (input.unNumber !== undefined) {
      product.changeUnNumber(input.unNumber);
    }

    if (input.riskClass !== undefined) {
      product.changeRiskClass(input.riskClass);
    }

    if (input.physicalState !== undefined) {
      product.changePhysicalState(input.physicalState);
    }

    return this.products.update(product);
  }

  private async changeCode(product: ChemicalProduct, code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode === product.code) {
      return;
    }

    const existing = await this.products.findByCode(normalizedCode);

    if (existing) {
      throw new ConflictError(
        `Já existe um produto químico cadastrado com o código "${normalizedCode}".`,
      );
    }

    product.changeCode(normalizedCode);
  }
}
