import { Module } from '@nestjs/common';
import { AddProductDocumentUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/add-product-document.use-case.js';
import { ChangeChemicalProductStatusUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { FindChemicalProductByIdUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import { PrismaChemicalProductRepository } from '@/modules/produtos-quimicos/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import { ChemicalProductsController } from '@/modules/produtos-quimicos/presentation/controllers/chemical-products.controller.js';

@Module({
  controllers: [ChemicalProductsController],
  providers: [
    CreateChemicalProductUseCase,
    ListChemicalProductsUseCase,
    FindChemicalProductByIdUseCase,
    UpdateChemicalProductUseCase,
    ChangeChemicalProductStatusUseCase,
    DeleteChemicalProductUseCase,
    AddProductDocumentUseCase,
    RemoveProductDocumentUseCase,
    { provide: CHEMICAL_PRODUCT_REPOSITORY, useClass: PrismaChemicalProductRepository },
  ],
})
export class ProdutosQuimicosModule {}
