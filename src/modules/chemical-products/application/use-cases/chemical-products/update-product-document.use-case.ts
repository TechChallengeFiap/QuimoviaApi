import { Inject, Injectable } from '@nestjs/common';
import type {
  ProductDocument,
  UpdateProductDocumentData,
} from '@/modules/chemical-products/domain/entities/product-document.entity.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class UpdateProductDocumentUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly products: ChemicalProductRepository,
  ) {}

  async execute(
    productId: string,
    documentId: string,
    input: UpdateProductDocumentData,
  ): Promise<ProductDocument> {
    const product = await this.products.findById(productId);
    if (!product) throw new ResourceNotFoundError('Produto químico', productId);
    product.updateDocument(documentId, input);
    const updated = await this.products.update(product);
    const document = updated.findDocument(documentId);
    if (!document)
      throw new ResourceNotFoundError('Documento do produto', documentId);
    return document;
  }
}
