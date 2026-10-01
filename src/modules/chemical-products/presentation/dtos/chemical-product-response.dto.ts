import { ApiProperty } from '@nestjs/swagger';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ProductDocumentResponseDto } from './product-document-response.dto.js';

/** Representação de um produto químico exposta pela API. */
export class ChemicalProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() technicalName: string;
  @ApiProperty({ nullable: true, type: String }) tradeName: string | null;
  @ApiProperty({ description: 'Número ONU' }) unNumber: string;
  @ApiProperty({ enum: ProductRiskClass }) riskClass: ProductRiskClass;
  @ApiProperty({ enum: ProductPhysicalState }) physicalState: ProductPhysicalState;
  @ApiProperty({ enum: ProductStatus }) status: ProductStatus;
  @ApiProperty({ type: [ProductDocumentResponseDto] }) documents: ProductDocumentResponseDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  private constructor(data: ChemicalProductResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(product: ChemicalProduct): ChemicalProductResponseDto {
    return new ChemicalProductResponseDto({
      id: product.id,
      code: product.code,
      technicalName: product.technicalName,
      tradeName: product.tradeName,
      unNumber: product.unNumber,
      riskClass: product.riskClass,
      physicalState: product.physicalState,
      status: product.status,
      documents: product.documents.map((document) =>
        ProductDocumentResponseDto.fromEntity(document),
      ),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
