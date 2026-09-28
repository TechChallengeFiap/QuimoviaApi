import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/produtos-quimicos/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/produtos-quimicos/domain/enums/product-document-type.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';

export interface AddProductDocumentInput {
  type: ProductDocumentType;
  number: string;
  expiresAt?: Date | null;
  filePath: string;
}

@Injectable()
export class AddProductDocumentUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(productId: string, input: AddProductDocumentInput): Promise<ChemicalProduct> {
    const product = await this.products.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', productId);
    }

    product.addDocument(input);

    return this.products.update(product);
  }
}
