import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/produtos-quimicos/domain/entities/chemical-product.entity.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';
import { BusinessRuleError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';

/**
 * Altera o status de um produto químico (Operador Portuário).
 *
 * O operador pode ativar, inativar ou bloquear o produto. UNDER_ANALYSIS é
 * apenas o status inicial do cadastro e não pode ser definido por aqui.
 */
@Injectable()
export class ChangeChemicalProductStatusUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(id: string, status: ProductStatus): Promise<ChemicalProduct> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    if (product.status === status) {
      return product;
    }

    switch (status) {
      case ProductStatus.ACTIVE:
        product.activate();
        break;
      case ProductStatus.INACTIVE:
        product.deactivate();
        break;
      case ProductStatus.BLOCKED:
        product.block();
        break;
      default:
        throw new BusinessRuleError(
          `O status ${status} é apenas o status inicial do cadastro e não pode ser atribuído a um produto já cadastrado.`,
        );
    }

    return this.products.update(product);
  }
}
