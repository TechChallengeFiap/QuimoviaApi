import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentDetails } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import type { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
  type UserSummary,
} from '@/modules/user/public/index.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

export interface UpdateChemicalShipmentInput {
  status?: StatusShipment;
  productId?: string;
  responsibleUserId?: string;
  documentsIds?: string;
}

@Injectable()
export class UpdateChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
  ) {}

  /**
   * As alterações são aplicadas nesta ordem; como uma carga aprovada ou
   * reprovada não muda mais, a mudança de status vale para as alterações
   * seguintes da mesma requisição.
   */
  async execute(
    id: string,
    input: UpdateChemicalShipmentInput,
  ): Promise<ChemicalShipmentDetails> {
    const chemicalShipment = await this.chemicalShipments.findById(id);

    if (!chemicalShipment) {
      throw new ResourceNotFoundError('Carga Química', id);
    }

    if (input.status) {
      chemicalShipment.changeStatus(input.status);
    }

    if (input.productId) {
      chemicalShipment.changeProduct(input.productId);
    }

    let newResponsibleUser: UserSummary | null = null;

    if (input.responsibleUserId) {
      newResponsibleUser = await this.users.findById(input.responsibleUserId);
      if (!newResponsibleUser) {
        throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
      }

      chemicalShipment.changeResponsibleUser(input.responsibleUserId);
    }

    if (input.documentsIds) {
      chemicalShipment.changeDocuments(input.documentsIds);
    }

    const shipment = await this.chemicalShipments.update(chemicalShipment);
    const responsibleUser =
      newResponsibleUser ??
      (await this.users.findById(shipment.responsibleUserId));

    return { shipment, responsibleUser };
  }
}
