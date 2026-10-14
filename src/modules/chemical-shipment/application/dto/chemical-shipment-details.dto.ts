import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import type { UserSummary } from '@/modules/user/public/index.js';

/**
 * Resultado dos casos de uso de cargas: a carga e o resumo do usuário
 * responsável, obtido pelo contrato público de Identidade e Acesso.
 */
export interface ChemicalShipmentDetails {
  shipment: ChemicalShipment;
  /** Nulo se o usuário responsável não for encontrado. */
  responsibleUser: UserSummary | null;
}

export interface ChemicalShipmentDetailsPage {
  items: ChemicalShipmentDetails[];
  total: number;
  page: number;
  pageSize: number;
}
