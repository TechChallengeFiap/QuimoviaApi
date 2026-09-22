import { StatusShipment } from '../../value-objects/chemical-shipment/status-shipment.vo.ts';

export class ChemicalShipmentVO {
  readonly id: string;
  readonly createdAt: Date;

  productId: string;
  status: StatusShipment;
  responsibleUserId: string;
  documentsIds: string;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(props: ChemicalShipmentVO) {
    Object.assign(this, props);
  }
}

export class CreateChemicalShipmentVO {
  productId: string;
  responsibleUserId: string;
  documentsIds: string;

  constructor(props: CreateChemicalShipmentVO) {
    Object.assign(this, props);
  }
}
