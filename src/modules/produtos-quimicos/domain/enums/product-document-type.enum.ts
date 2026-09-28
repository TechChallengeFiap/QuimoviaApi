/** Tipo de documento que pode ser vinculado a um produto químico. */
export enum ProductDocumentType {
  SAFETY_DATA_SHEET = 'SAFETY_DATA_SHEET',
  CERTIFICATE = 'CERTIFICATE',
  ENVIRONMENTAL_LICENSE = 'ENVIRONMENTAL_LICENSE',
  TECHNICAL_REPORT = 'TECHNICAL_REPORT',
  AUTHORIZATION = 'AUTHORIZATION',
}

export const PRODUCT_DOCUMENT_TYPES = Object.values(ProductDocumentType);
