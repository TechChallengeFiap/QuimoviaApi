import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ChemicalShipmentPage,
  ChemicalShipmentRepository,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListChemicalShipmentsInput {
  status?: StatusShipment;
  productId?: string;
  responsibleUserId?: string;
  documentsIds?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListChemicalShipmentsUseCase {
  private readonly logger = new Logger(ListChemicalShipmentsUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
  ) {}

  async execute(
    input: ListChemicalShipmentsInput = {},
  ): Promise<ChemicalShipmentPage> {
    try {
      return await this.chemicalShipments.list({
        status: input.status,
        productId: input.productId,
        responsibleUserId: input.responsibleUserId,
        documentsIds: input.documentsIds,
        page: input.page ? Number(input.page) : DEFAULT_PAGE,
        pageSize: input.pageSize ? Number(input.pageSize) : DEFAULT_PAGE_SIZE,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar cargas químicas: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
