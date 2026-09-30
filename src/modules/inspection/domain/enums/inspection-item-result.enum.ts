/** Resultado registrado pelo Fiscal para uma verificação da inspeção. */
export enum InspectionItemResult {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
}

export const INSPECTION_ITEM_RESULTS = Object.values(InspectionItemResult);
