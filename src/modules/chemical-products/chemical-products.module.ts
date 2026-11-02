import { Module } from '@nestjs/common';
import { ActivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/activate-chemical-product.use-case.js';
import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { BlockChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/block-chemical-product.use-case.js';
import { ChangeChemicalProductStatusUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { DeactivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/deactivate-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { FindChemicalProductByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { FindProductDocumentByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-product-document-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { ListProductDocumentsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-product-documents.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { RestoreChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/restore-chemical-product.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { UpdateProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-product-document.use-case.js';
import { ApproveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/approve-lot.use-case.js';
import { CancelLotReservationUseCase } from '@/modules/chemical-products/application/use-cases/lots/cancel-lot-reservation.use-case.js';
import { CreateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/create-lot.use-case.js';
import { DisposeLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/dispose-lot.use-case.js';
import { ExpireLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/expire-lot.use-case.js';
import { FindLotByIdUseCase } from '@/modules/chemical-products/application/use-cases/lots/find-lot-by-id.use-case.js';
import { ListLotsUseCase } from '@/modules/chemical-products/application/use-cases/lots/list-lots.use-case.js';
import { QuarantineLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/quarantine-lot.use-case.js';
import { ReleaseLotFromQuarantineUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot-from-quarantine.use-case.js';
import { ReleaseLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot.use-case.js';
import { ReserveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/reserve-lot.use-case.js';
import { StartLotInspectionUseCase } from '@/modules/chemical-products/application/use-cases/lots/start-lot-inspection.use-case.js';
import { StoreLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/store-lot.use-case.js';
import { UpdateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/update-lot.use-case.js';
import { WithdrawLotFromStorageUseCase } from '@/modules/chemical-products/application/use-cases/lots/withdraw-lot-from-storage.use-case.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { PrismaChemicalProductRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import { PrismaLotRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-lot.repository.js';
import { ChemicalProductsController } from '@/modules/chemical-products/presentation/controllers/chemical-products.controller.js';
import { LotsController } from '@/modules/chemical-products/presentation/controllers/lots.controller.js';
import { ProductDocumentsController } from '@/modules/chemical-products/presentation/controllers/product-documents.controller.js';
import { UserModule } from '@/modules/user/user.module.js';

@Module({
  /** UserModule exporta USER_REPOSITORY, usado para validar o usuário responsável. */
  imports: [UserModule],
  controllers: [ChemicalProductsController, ProductDocumentsController, LotsController],
  providers: [
    // Produtos químicos
    CreateChemicalProductUseCase,
    ListChemicalProductsUseCase,
    FindChemicalProductByIdUseCase,
    UpdateChemicalProductUseCase,
    ChangeChemicalProductStatusUseCase,
    ActivateChemicalProductUseCase,
    DeactivateChemicalProductUseCase,
    BlockChemicalProductUseCase,
    DeleteChemicalProductUseCase,
    RestoreChemicalProductUseCase,
    // Documentos do produto
    AddProductDocumentUseCase,
    RemoveProductDocumentUseCase,
    ListProductDocumentsUseCase,
    FindProductDocumentByIdUseCase,
    UpdateProductDocumentUseCase,
    // Lotes
    CreateLotUseCase,
    ListLotsUseCase,
    FindLotByIdUseCase,
    UpdateLotUseCase,
    StartLotInspectionUseCase,
    ApproveLotUseCase,
    ReserveLotUseCase,
    CancelLotReservationUseCase,
    StoreLotUseCase,
    WithdrawLotFromStorageUseCase,
    QuarantineLotUseCase,
    ReleaseLotFromQuarantineUseCase,
    ReleaseLotUseCase,
    ExpireLotUseCase,
    DisposeLotUseCase,
    // Persistência
    {
      provide: CHEMICAL_PRODUCT_REPOSITORY,
      useClass: PrismaChemicalProductRepository,
    },
    { provide: LOT_REPOSITORY, useClass: PrismaLotRepository },
  ],
  exports: [CHEMICAL_PRODUCT_REPOSITORY, LOT_REPOSITORY],
})
export class ChemicalProductsModule {}
