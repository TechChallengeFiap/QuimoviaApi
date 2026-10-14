import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipmentDetailsPage } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import type { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';

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
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
  ) {}

  async execute(
    input: ListChemicalShipmentsInput = {},
  ): Promise<ChemicalShipmentDetailsPage> {
    try {
      const page = await this.chemicalShipments.list({
        status: input.status,
        productId: input.productId,
        responsibleUserId: input.responsibleUserId,
        documentsIds: input.documentsIds,
        page: input.page ? Number(input.page) : DEFAULT_PAGE,
        pageSize: input.pageSize ? Number(input.pageSize) : DEFAULT_PAGE_SIZE,
      });

      // Uma única consulta traz os responsáveis de todas as cargas da página.
      const responsibleUsers = await this.users.findByIds(
        page.items.map((shipment) => shipment.responsibleUserId),
      );
      const responsibleUsersById = new Map(
        responsibleUsers.map((user) => [user.id, user]),
      );

      return {
        ...page,
        items: page.items.map((shipment) => ({
          shipment,
          responsibleUser:
            responsibleUsersById.get(shipment.responsibleUserId) ?? null,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar cargas químicas: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
