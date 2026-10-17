import { Module } from '@nestjs/common';
import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { ChangeChemicalProductStatusUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { FindChemicalProductByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { PrismaChemicalProductRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import { ChemicalProductsController } from '@/modules/chemical-products/presentation/controllers/chemical-products.controller.js';
import { UserModule } from '@/modules/user/user.module.js';

@Module({
  /** UserModule exporta USER_REPOSITORY, usado para validar o usuário responsável. */
  imports: [UserModule],
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
    {
      provide: CHEMICAL_PRODUCT_REPOSITORY,
      useClass: PrismaChemicalProductRepository,
    },
  ],
  exports: [CHEMICAL_PRODUCT_REPOSITORY],
})
export class ChemicalProductsModule {}
