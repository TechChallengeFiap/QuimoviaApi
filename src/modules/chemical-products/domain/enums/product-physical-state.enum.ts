/** Estado físico em que o produto químico se encontra. */
export enum ProductPhysicalState {
  SOLID = 'SOLID',
  LIQUID = 'LIQUID',
  GASEOUS = 'GASEOUS',
}

export const PRODUCT_PHYSICAL_STATES = Object.values(ProductPhysicalState);
