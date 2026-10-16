import { Inject, Injectable } from '@nestjs/common';
import {
  ChemicalProductRepository,
  ChemicalProductSearchFilters,
  ChemicalProductPage,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocument } from '@/modules/chemical-products/domain/entities/product-document.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import type {
  ChemicalProductModel,
  ProductDocumentModel,
} from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

type PersistedChemicalProduct = ChemicalProductModel & { documents: ProductDocumentModel[] };

/** Os documentos são sempre carregados junto com o produto (agregado inteiro). */
const WITH_DOCUMENTS = { documents: { orderBy: { createdAt: 'asc' } } } as const;

@Injectable()
export class PrismaChemicalProductRepository implements ChemicalProductRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(product: ChemicalProduct): Promise<ChemicalProduct> {
    const record = await this.prisma.chemicalProduct.create({
      data: {
        id: product.id,
        ...PrismaChemicalProductRepository.toPersistence(product),
        documents: {
          create: product.documents.map((document) =>
            PrismaChemicalProductRepository.documentToPersistence(document),
          ),
        },
      },
      include: WITH_DOCUMENTS,
    });

    return PrismaChemicalProductRepository.toDomain(record);
  }

  /**
   * Sincroniza o agregado inteiro em uma única operação: documentos que não
   * estão mais no agregado são removidos e os demais são criados ou mantidos.
   */
  async update(product: ChemicalProduct): Promise<ChemicalProduct> {
    const documents = product.documents;

    const record = await this.prisma.chemicalProduct.update({
      where: { id: product.id },
      data: {
        ...PrismaChemicalProductRepository.toPersistence(product),
        documents: {
          deleteMany: { id: { notIn: documents.map((document) => document.id) } },
          upsert: documents.map((document) => {
            const data = PrismaChemicalProductRepository.documentToPersistence(document);
            return { where: { id: document.id }, create: data, update: data };
          }),
        },
      },
      include: WITH_DOCUMENTS,
    });

    return PrismaChemicalProductRepository.toDomain(record);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.chemicalProduct.delete({ where: { id } });
  }

  async findById(id: string): Promise<ChemicalProduct | null> {
    const record = await this.prisma.chemicalProduct.findUnique({
      where: { id },
      include: WITH_DOCUMENTS,
    });

    return record ? PrismaChemicalProductRepository.toDomain(record) : null;
  }

  async findByCode(code: string): Promise<ChemicalProduct | null> {
    const record = await this.prisma.chemicalProduct.findUnique({
      where: { code },
      include: WITH_DOCUMENTS,
    });

    return record ? PrismaChemicalProductRepository.toDomain(record) : null;
  }

  async list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage> {
    const where = {
      ...(filters.riskClass ? { riskClass: filters.riskClass } : {}),
      ...(filters.physicalState ? { physicalState: filters.physicalState } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.chemicalProduct.findMany({
        where,
        include: WITH_DOCUMENTS,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.chemicalProduct.count({ where }),
    ]);

    return {
      items: records.map((record) => PrismaChemicalProductRepository.toDomain(record)),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private static toPersistence(product: ChemicalProduct) {
    return {
      code: product.code,
      technicalName: product.technicalName,
      tradeName: product.tradeName,
      unNumber: product.unNumber,
      riskClass: product.riskClass,
      physicalState: product.physicalState,
      status: product.status,
    };
  }

  private static documentToPersistence(document: ProductDocument) {
    return {
      id: document.id,
      type: document.type,
      number: document.number,
      expiresAt: document.expiresAt,
      filePath: document.filePath,
      createdAt: document.createdAt,
    };
  }

  private static toDomain(record: PersistedChemicalProduct): ChemicalProduct {
    return ChemicalProduct.restore({
      id: record.id,
      code: record.code,
      technicalName: record.technicalName,
      tradeName: record.tradeName,
      unNumber: record.unNumber,
      riskClass: record.riskClass as ProductRiskClass,
      physicalState: record.physicalState as ProductPhysicalState,
      status: record.status as ProductStatus,
      documents: record.documents.map((document) =>
        PrismaChemicalProductRepository.documentToDomain(document),
      ),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private static documentToDomain(record: ProductDocumentModel): ProductDocument {
    return ProductDocument.restore({
      id: record.id,
      type: record.type as ProductDocumentType,
      number: record.number,
      expiresAt: record.expiresAt,
      filePath: record.filePath,
      createdAt: record.createdAt,
    });
  }
}
