import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';
import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';

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
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateChemicalShipmentInput,
  ): Promise<ChemicalShipment> {
    const existingChemicalShipment = await this.chemicalShipments.findById(id);

    if (!existingChemicalShipment) {
      throw new ResourceNotFoundError('Carga Química', id);
    }

    if (input.status) {
      existingChemicalShipment.updateChemicalShipmentStatus(
        existingChemicalShipment,
        input.status,
      );
    }

    if (input.productId) {
      existingChemicalShipment.changeChemicalShipmentProduct(
        existingChemicalShipment,
        input.productId,
      );
    }

    if (input.responsibleUserId) {
      const user = await this.users.findById(input.responsibleUserId);
      if (!user) {
        throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
      }

      existingChemicalShipment.changeChemicalShipmentResponsibleUser(
        existingChemicalShipment,
        input.responsibleUserId,
      );
    }

    if (input.documentsIds) {
      existingChemicalShipment.changeChemicalShipmentDocuments(
        existingChemicalShipment,
        input.documentsIds,
      );
    }

    return await this.chemicalShipments.update(existingChemicalShipment);
  }
}
