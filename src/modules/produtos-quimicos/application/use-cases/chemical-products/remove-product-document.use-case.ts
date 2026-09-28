import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/produtos-quimicos/domain/entities/chemical-product.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';

@Injectable()
export class RemoveProductDocumentUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(productId: string, documentId: string): Promise<ChemicalProduct> {
    const product = await this.products.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', productId);
    }

    product.removeDocument(documentId);

    return this.products.update(product);
  }
}
