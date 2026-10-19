import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';
import { ProductDocumentResponseDto } from './product-document-response.dto.js';

/** Representação de um produto químico exposta pela API. */
export class ChemicalProductResponseDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) code: string;
  @ApiProperty({ type: String }) technicalName: string;
  @ApiProperty({ nullable: true, type: String }) tradeName: string | null;
  @ApiProperty({ type: String, description: 'Número ONU' }) unNumber: string;
  @ApiProperty({ enum: ProductRiskClass, type: String }) riskClass: ProductRiskClass;
  @ApiProperty({ enum: ProductPhysicalState, type: String }) physicalState: ProductPhysicalState;
  @ApiProperty({ enum: ProductStatus, type: String }) status: ProductStatus;

  @ApiProperty({ type: String, description: 'ID do usuário responsável pelo produto' })
  responsibleUserId: string;

  @ApiPropertyOptional({
    type: () => UserResponseDto,
    nullable: true,
    description: 'Dados do usuário responsável pelo produto químico',
  })
  responsibleUser: UserResponseDto | null;

  @ApiProperty({ type: [ProductDocumentResponseDto] }) documents: ProductDocumentResponseDto[];
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;

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
      responsibleUserId: product.responsibleUserId,
      responsibleUser: product.responsibleUser
        ? UserResponseDto.fromEntity(product.responsibleUser)
        : null,
      documents: product.documents.map((document) =>
        ProductDocumentResponseDto.fromEntity(document),
      ),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
