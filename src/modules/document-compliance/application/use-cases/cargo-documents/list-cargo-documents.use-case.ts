import { Inject, Injectable } from '@nestjs/common';
import type { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import type {
  CargoDocumentPage,
  CargoDocumentRepository,
} from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListCargoDocumentsInput {
  cargoId?: string;
  shipperId?: string;
  status?: CargoDocumentStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListCargoDocumentsUseCase {
  constructor(
    @Inject(CARGO_DOCUMENT_REPOSITORY)
    private readonly documents: CargoDocumentRepository,
  ) {}

  async execute(
    input: ListCargoDocumentsInput = {},
  ): Promise<CargoDocumentPage> {
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)
    ) {
      throw new BusinessRuleError(
        'Informe uma página válida e entre 1 e 100 registros por página.',
      );
    }
    return this.documents.list({
      cargoId: input.cargoId?.toLowerCase(),
      shipperId: input.shipperId?.toLowerCase(),
      status: input.status,
      page,
      pageSize,
    });
  }
}
