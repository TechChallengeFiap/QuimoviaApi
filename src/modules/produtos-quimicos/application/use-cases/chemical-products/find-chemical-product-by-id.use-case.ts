import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/produtos-quimicos/domain/entities/chemical-product.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';

@Injectable()
export class FindChemicalProductByIdUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(id: string): Promise<ChemicalProduct> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    return product;
  }
}
