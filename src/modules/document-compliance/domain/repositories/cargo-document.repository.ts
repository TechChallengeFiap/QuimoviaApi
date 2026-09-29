import type { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import type { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';

export interface CargoDocumentSearchFilters {
  cargoId?: string;
  shipperId?: string;
  status?: CargoDocumentStatus;
  page: number;
  pageSize: number;
}

export interface CargoDocumentPage {
  items: CargoDocument[];
  total: number;
  page: number;
  pageSize: number;
}

/** Contrato de persistência do agregado, incluindo seus anexos. */
export interface CargoDocumentRepository {
  create(document: CargoDocument): Promise<CargoDocument>;
  update(document: CargoDocument): Promise<CargoDocument>;
  remove(id: string, revision: number): Promise<void>;
  findById(id: string): Promise<CargoDocument | null>;
  findByCargoId(cargoId: string): Promise<CargoDocument | null>;
  list(filters: CargoDocumentSearchFilters): Promise<CargoDocumentPage>;
}

export const CARGO_DOCUMENT_REPOSITORY = Symbol('CargoDocumentRepository');
