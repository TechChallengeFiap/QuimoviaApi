import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';

export interface ProductDocumentProperties {
  id: string;
  type: ProductDocumentType;
  number: string;
  expiresAt: Date | null;
  filePath: string;
  createdAt: Date;
}

export interface CreateProductDocumentData {
  type: ProductDocumentType;
  number: string;
  expiresAt?: Date | null;
  filePath: string;
}

/**
 * Documento vinculado a um produto químico (FISPQ, certificado, licença...).
 *
 * É uma entidade interna do agregado Produto Químico: só é criada, alterada ou
 * removida por meio da raiz do agregado.
 */
export class ProductDocument {
  readonly id: string;
  readonly type: ProductDocumentType;
  readonly number: string;
  readonly expiresAt: Date | null;
  readonly filePath: string;
  readonly createdAt: Date;

  private constructor(properties: ProductDocumentProperties) {
    this.id = properties.id;
    this.type = properties.type;
    this.number = properties.number;
    this.expiresAt = properties.expiresAt;
    this.filePath = properties.filePath;
    this.createdAt = properties.createdAt;
  }

  /** Cria um novo documento, validando os dados informados. */
  static create(data: CreateProductDocumentData): ProductDocument {
    return new ProductDocument({
      id: randomUUID(),
      type: data.type,
      number: ProductDocument.validateNumber(data.number),
      expiresAt: data.expiresAt ?? null,
      filePath: ProductDocument.validateFilePath(data.filePath),
      createdAt: new Date(),
    });
  }

  /** Reconstrói um documento já persistido, sem revalidar os dados. */
  static restore(properties: ProductDocumentProperties): ProductDocument {
    return new ProductDocument(properties);
  }

  /** Um documento sem data de validade nunca expira. */
  isExpired(at: Date = new Date()): boolean {
    return this.expiresAt !== null && this.expiresAt.getTime() < at.getTime();
  }

  toObject(): ProductDocumentProperties {
    return {
      id: this.id,
      type: this.type,
      number: this.number,
      expiresAt: this.expiresAt,
      filePath: this.filePath,
      createdAt: this.createdAt,
    };
  }

  private static validateNumber(number: string): string {
    const normalizedNumber = number.trim();

    if (normalizedNumber.length === 0) {
      throw new BusinessRuleError('O número do documento do produto não pode ser vazio.');
    }

    return normalizedNumber;
  }

  private static validateFilePath(filePath: string): string {
    const normalizedFilePath = filePath.trim();

    if (normalizedFilePath.length === 0) {
      throw new BusinessRuleError('O caminho do arquivo do documento não pode ser vazio.');
    }

    return normalizedFilePath;
  }
}
