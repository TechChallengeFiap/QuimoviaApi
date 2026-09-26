import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts';
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
