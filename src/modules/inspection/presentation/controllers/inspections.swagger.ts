import { HttpStatus } from '@nestjs/common';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';

export const INSPECTION_ID_EXAMPLE = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
export const CARGO_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
export const CARGO_ITEM_ID_EXAMPLE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
export const INSPECTOR_ID_EXAMPLE = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

export const INSPECTION_NOT_FOUND_EXAMPLE = {
  message: `Inspeção não encontrado(a) para o identificador "${INSPECTION_ID_EXAMPLE}".`,
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

export const CARGO_NOT_FOUND_EXAMPLE = {
  message: `Carga Química não encontrado(a) para o identificador "${CARGO_ID_EXAMPLE}".`,
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

export const INSPECTOR_NOT_FOUND_EXAMPLE = {
  message: `Usuário não encontrado(a) para o identificador "${INSPECTOR_ID_EXAMPLE}".`,
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

export const CARGO_RESPONSE_EXAMPLE = {
  id: CARGO_ID_EXAMPLE,
  productId: '4bb485c2-f173-455b-b5cb-a034293f0190',
  quantityProduct: 1000,
  status: 'ANALYZING',
  responsibleUserId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  responsibleUser: {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    name: 'João Santos',
    email: 'joao.santos@quimovia.com',
    role: 'TECHNICAL_MANAGER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-25T14:30:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-25T14:30:00.000Z',
  },
  documentsIds: 'doc-001,doc-002',
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
  deletedAt: null,
};

export const INSPECTOR_RESPONSE_EXAMPLE = {
  id: INSPECTOR_ID_EXAMPLE,
  name: 'Carlos Oliveira',
  email: 'carlos.oliveira@quimovia.com',
  role: 'PORT_OPERATOR',
  status: 'ACTIVE',
  lastLoginAt: '2026-09-30T11:00:00.000Z',
  createdAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-09-30T11:00:00.000Z',
};

export const ENRICHED_INSPECTION_RESPONSE_EXAMPLE = {
  id: INSPECTION_ID_EXAMPLE,
  cargoId: CARGO_ID_EXAMPLE,
  cargo: CARGO_RESPONSE_EXAMPLE,
  compositionVersion: 1,
  scope: InspectionScope.CARGO,
  cargoItemId: null,
  inspectorId: INSPECTOR_ID_EXAMPLE,
  inspector: INSPECTOR_RESPONSE_EXAMPLE,
  status: InspectionStatus.PENDING,
  items: [
    {
      requirement: InspectionRequirement.PACKAGING_INTEGRITY,
      result: null,
      observation: null,
    },
    {
      requirement: InspectionRequirement.NO_LEAKAGE,
      result: null,
      observation: null,
    },
    {
      requirement: InspectionRequirement.CORRECT_LABELING,
      result: null,
      observation: null,
    },
  ],
  startedAt: null,
  completedAt: null,
  createdAt: '2026-09-30T12:00:00.000Z',
  updatedAt: '2026-09-30T12:00:00.000Z',
};

export const ENRICHED_INSPECTION_PAGE_RESPONSE_EXAMPLE = {
  items: [ENRICHED_INSPECTION_RESPONSE_EXAMPLE],
  total: 1,
  page: 1,
  pageSize: 20,
};
