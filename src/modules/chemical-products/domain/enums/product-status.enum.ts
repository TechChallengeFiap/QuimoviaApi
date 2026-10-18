/**
 * Situação atual do cadastro do produto químico.
 *
 * UNDER_ANALYSIS é o status inicial: o produto acabou de ser cadastrado e sua
 * documentação ainda está sendo avaliada. Apenas produtos ACTIVE podem ser
 * utilizados em novas operações.
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  UNDER_ANALYSIS = 'UNDER_ANALYSIS',
}

export const PRODUCT_STATUSES = Object.values(ProductStatus);
