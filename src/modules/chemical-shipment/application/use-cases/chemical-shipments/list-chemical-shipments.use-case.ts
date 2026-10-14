import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipmentDetails } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type {
  ChemicalShipmentRepository,
  ChemicalShipmentSearchFilters,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Page,
} from '@/shared/domain/pagination.js';
import { logError } from '@/shared/application/log-error.js';

export type ListChemicalShipmentsInput = Partial<ChemicalShipmentSearchFilters>;

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
  ): Promise<Page<ChemicalShipmentDetails>> {
    try {
      const page = await this.chemicalShipments.list({
        ...input,
        page: input.page ?? DEFAULT_PAGE,
        pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
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
      logError(this.logger, 'Erro ao listar cargas químicas', error);
      throw error;
    }
  }
}
