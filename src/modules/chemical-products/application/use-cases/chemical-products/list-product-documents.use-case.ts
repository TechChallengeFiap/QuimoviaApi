import { Inject, Injectable } from '@nestjs/common';
import type { ProductDocument } from '@/modules/chemical-products/domain/entities/product-document.entity.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class ListProductDocumentsUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly products: ChemicalProductRepository,
  ) {}

  async execute(productId: string): Promise<ProductDocument[]> {
    const product = await this.products.findById(productId);
    if (!product) throw new ResourceNotFoundError('Produto químico', productId);
    return product.documents;
  }
}
