import { Inject, Injectable } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ConflictError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export interface CreateProductDocumentInput {
  type: ProductDocumentType;
  number: string;
  expiresAt?: Date | null;
  filePath: string;
}

export interface CreateChemicalProductInput {
  code: string;
  technicalName: string;
  tradeName?: string | null;
  unNumber: string;
  riskClass: ProductRiskClass;
  physicalState: ProductPhysicalState;
  status?: ProductStatus;
  responsibleUserId: string;
  documents?: CreateProductDocumentInput[];
}

@Injectable()
export class CreateChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: CreateChemicalProductInput): Promise<ChemicalProduct> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.products.findByCode(code);

    if (existing) {
      throw new ConflictError(`Já existe um produto químico cadastrado com o código "${code}".`);
    }

    const responsibleUser = await this.users.findById(input.responsibleUserId);

    if (!responsibleUser) {
      throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
    }

    const product = ChemicalProduct.create({
      code,
      technicalName: input.technicalName,
      tradeName: input.tradeName,
      unNumber: input.unNumber,
      riskClass: input.riskClass,
      physicalState: input.physicalState,
      status: input.status,
      responsibleUserId: responsibleUser.id,
      documents: input.documents,
    });

    return this.products.create(product);
  }
}
