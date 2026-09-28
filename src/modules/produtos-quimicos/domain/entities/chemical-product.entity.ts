import { randomUUID } from 'node:crypto';
import { BusinessRuleError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ProductDocument } from '@/modules/produtos-quimicos/domain/entities/product-document.entity.js';
import type { CreateProductDocumentData } from '@/modules/produtos-quimicos/domain/entities/product-document.entity.js';
import { ProductPhysicalState } from '@/modules/produtos-quimicos/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/produtos-quimicos/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';

const MIN_TECHNICAL_NAME_LENGTH = 3;
const CODE_FORMAT = /^[A-Z0-9][A-Z0-9._-]*$/;
/** Números ONU são identificadores numéricos de exatamente 4 dígitos. */
const UN_NUMBER_FORMAT = /^\d{4}$/;

export interface ChemicalProductProperties {
  id: string;
  code: string;
  technicalName: string;
  tradeName: string | null;
  unNumber: string;
  riskClass: ProductRiskClass;
  physicalState: ProductPhysicalState;
  status: ProductStatus;
  documents: ProductDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChemicalProductData {
  code: string;
  technicalName: string;
  tradeName?: string | null;
  unNumber: string;
  riskClass: ProductRiskClass;
  physicalState: ProductPhysicalState;
  status?: ProductStatus;
  documents?: CreateProductDocumentData[];
}

/**
 * Raiz do agregado Produto Químico.
 *
 * Concentra as invariantes do cadastro (código, nome técnico, número ONU,
 * classe de risco e estado físico obrigatórios) e controla o ciclo de vida do
 * produto e de seus documentos: nenhum elemento interno do agregado é alterado
 * sem passar por um de seus métodos. A unicidade do código é a única regra que
 * a entidade não consegue garantir sozinha: ela depende do repositório, que
 * consulta o conjunto completo de produtos.
 */
export class ChemicalProduct {
  readonly id: string;
  readonly createdAt: Date;

  #code: string;
  #technicalName: string;
  #tradeName: string | null;
  #unNumber: string;
  #riskClass: ProductRiskClass;
  #physicalState: ProductPhysicalState;
  #status: ProductStatus;
  #documents: ProductDocument[];
  #updatedAt: Date;

  private constructor(properties: ChemicalProductProperties) {
    this.id = properties.id;
    this.createdAt = properties.createdAt;
    this.#code = properties.code;
    this.#technicalName = properties.technicalName;
    this.#tradeName = properties.tradeName;
    this.#unNumber = properties.unNumber;
    this.#riskClass = properties.riskClass;
    this.#physicalState = properties.physicalState;
    this.#status = properties.status;
    this.#documents = [...properties.documents];
    this.#updatedAt = properties.updatedAt;
  }

  /** Cria um novo produto químico, validando os dados informados. */
  static create(data: CreateChemicalProductData): ChemicalProduct {
    const now = new Date();

    return new ChemicalProduct({
      id: randomUUID(),
      code: ChemicalProduct.validateCode(data.code),
      technicalName: ChemicalProduct.validateTechnicalName(data.technicalName),
      tradeName: ChemicalProduct.normalizeTradeName(data.tradeName),
      unNumber: ChemicalProduct.validateUnNumber(data.unNumber),
      riskClass: data.riskClass,
      physicalState: data.physicalState,
      status: data.status ?? ProductStatus.UNDER_ANALYSIS,
      documents: (data.documents ?? []).map((document) => ProductDocument.create(document)),
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstrói um produto já persistido, sem revalidar os dados. */
  static restore(properties: ChemicalProductProperties): ChemicalProduct {
    return new ChemicalProduct(properties);
  }

  get code(): string {
    return this.#code;
  }

  get technicalName(): string {
    return this.#technicalName;
  }

  get tradeName(): string | null {
    return this.#tradeName;
  }

  get unNumber(): string {
    return this.#unNumber;
  }

  get riskClass(): ProductRiskClass {
    return this.#riskClass;
  }

  get physicalState(): ProductPhysicalState {
    return this.#physicalState;
  }

  get status(): ProductStatus {
    return this.#status;
  }

  /** Cópia defensiva: a lista só é alterada por meio dos métodos do agregado. */
  get documents(): ProductDocument[] {
    return [...this.#documents];
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  changeCode(code: string): void {
    this.#code = ChemicalProduct.validateCode(code);
    this.markAsUpdated();
  }

  changeTechnicalName(technicalName: string): void {
    this.#technicalName = ChemicalProduct.validateTechnicalName(technicalName);
    this.markAsUpdated();
  }

  changeTradeName(tradeName: string | null): void {
    this.#tradeName = ChemicalProduct.normalizeTradeName(tradeName);
    this.markAsUpdated();
  }

  changeUnNumber(unNumber: string): void {
    this.#unNumber = ChemicalProduct.validateUnNumber(unNumber);
    this.markAsUpdated();
  }

  /** A classe de risco só pode ser alterada por meio da raiz do agregado. */
  changeRiskClass(riskClass: ProductRiskClass): void {
    this.#riskClass = riskClass;
    this.markAsUpdated();
  }

  changePhysicalState(physicalState: ProductPhysicalState): void {
    this.#physicalState = physicalState;
    this.markAsUpdated();
  }

  activate(): void {
    this.changeStatus(ProductStatus.ACTIVE);
  }

  deactivate(): void {
    this.changeStatus(ProductStatus.INACTIVE);
  }

  block(): void {
    this.changeStatus(ProductStatus.BLOCKED);
  }

  /** Apenas produtos ativos podem ser utilizados em novas operações. */
  canBeUsedInOperations(): boolean {
    return this.#status === ProductStatus.ACTIVE;
  }

  addDocument(data: CreateProductDocumentData): ProductDocument {
    const document = ProductDocument.create(data);

    this.#documents.push(document);
    this.markAsUpdated();

    return document;
  }

  removeDocument(documentId: string): void {
    const index = this.#documents.findIndex((document) => document.id === documentId);

    if (index === -1) {
      throw new ResourceNotFoundError('Documento do produto', documentId);
    }

    this.#documents.splice(index, 1);
    this.markAsUpdated();
  }

  findDocument(documentId: string): ProductDocument | null {
    return this.#documents.find((document) => document.id === documentId) ?? null;
  }

  toObject(): ChemicalProductProperties {
    return {
      id: this.id,
      code: this.#code,
      technicalName: this.#technicalName,
      tradeName: this.#tradeName,
      unNumber: this.#unNumber,
      riskClass: this.#riskClass,
      physicalState: this.#physicalState,
      status: this.#status,
      documents: this.documents,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
    };
  }

  private changeStatus(status: ProductStatus): void {
    if (this.#status === status) {
      return;
    }

    this.#status = status;
    this.markAsUpdated();
  }

  private markAsUpdated(): void {
    this.#updatedAt = new Date();
  }

  private static validateCode(code: string): string {
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length === 0) {
      throw new BusinessRuleError('O código do produto químico não pode ser vazio.');
    }

    if (!CODE_FORMAT.test(normalizedCode)) {
      throw new BusinessRuleError(
        `O código "${code}" não é válido: use apenas letras, números, ponto, hífen ou sublinhado.`,
      );
    }

    return normalizedCode;
  }

  private static validateTechnicalName(technicalName: string): string {
    const normalizedName = technicalName.trim();

    if (normalizedName.length < MIN_TECHNICAL_NAME_LENGTH) {
      throw new BusinessRuleError(
        `O nome técnico do produto químico deve ter ao menos ${MIN_TECHNICAL_NAME_LENGTH} caracteres.`,
      );
    }

    return normalizedName;
  }

  private static normalizeTradeName(tradeName: string | null | undefined): string | null {
    const normalizedName = tradeName?.trim() ?? '';

    return normalizedName.length === 0 ? null : normalizedName;
  }

  private static validateUnNumber(unNumber: string): string {
    const normalizedUnNumber = unNumber.trim();

    if (!UN_NUMBER_FORMAT.test(normalizedUnNumber)) {
      throw new BusinessRuleError(
        `O número ONU "${unNumber}" não é válido: deve conter exatamente 4 dígitos.`,
      );
    }

    return normalizedUnNumber;
  }
}
