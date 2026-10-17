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
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type {
  ChemicalProductModel,
  ProductDocumentModel,
  UserModel,
} from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';

type PersistedChemicalProduct = ChemicalProductModel & {
  documents: ProductDocumentModel[];
  responsibleUser?: UserModel | null;
};

/**
 * O agregado é sempre carregado inteiro: documentos e usuário responsável vêm
 * junto com o produto.
 */
const WITH_RELATIONS = {
  documents: { orderBy: { createdAt: 'asc' } },
  responsibleUser: true,
} as const;

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
      include: WITH_RELATIONS,
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
      include: WITH_RELATIONS,
    });

    return PrismaChemicalProductRepository.toDomain(record);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.chemicalProduct.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new ConflictError(
          'Não é possível excluir o produto químico porque existem registros associados a ele.',
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<ChemicalProduct | null> {
    const record = await this.prisma.chemicalProduct.findUnique({
      where: { id },
      include: WITH_RELATIONS,
    });

    return record ? PrismaChemicalProductRepository.toDomain(record) : null;
  }

  async findByCode(code: string): Promise<ChemicalProduct | null> {
    const record = await this.prisma.chemicalProduct.findUnique({
      where: { code },
      include: WITH_RELATIONS,
    });

    return record ? PrismaChemicalProductRepository.toDomain(record) : null;
  }

  async list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage> {
    const where = {
      ...(filters.riskClass ? { riskClass: filters.riskClass } : {}),
      ...(filters.physicalState ? { physicalState: filters.physicalState } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.responsibleUserId ? { responsibleUserId: filters.responsibleUserId } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.chemicalProduct.findMany({
        where,
        include: WITH_RELATIONS,
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
      responsibleUserId: product.responsibleUserId,
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
      responsibleUserId: record.responsibleUserId,
      responsibleUser: record.responsibleUser
        ? PrismaChemicalProductRepository.userToDomain(record.responsibleUser)
        : null,
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

  private static userToDomain(record: UserModel): User {
    return User.restore({
      id: record.id,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      status: record.status as UserStatus,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
