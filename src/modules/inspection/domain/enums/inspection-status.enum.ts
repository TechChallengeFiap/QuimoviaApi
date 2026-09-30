/** Situação atual da inspeção dentro do seu ciclo de vida. */
export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const INSPECTION_STATUSES = Object.values(InspectionStatus);
