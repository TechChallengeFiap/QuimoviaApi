/** Verificação de segurança que pode ser prevista em uma inspeção. */
export enum InspectionRequirement {
  EXPIRATION_DATE = 'EXPIRATION_DATE',
  PACKAGING_INTEGRITY = 'PACKAGING_INTEGRITY',
  NO_LEAKAGE = 'NO_LEAKAGE',
  CORRECT_LABELING = 'CORRECT_LABELING',
  TRANSPORT_CONDITIONS = 'TRANSPORT_CONDITIONS',
  SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
}

export const INSPECTION_REQUIREMENTS = Object.values(InspectionRequirement);
