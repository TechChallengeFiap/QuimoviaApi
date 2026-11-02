import { ApiProperty } from '@nestjs/swagger';
import { ProductDocument } from '@/modules/chemical-products/domain/entities/product-document.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';

export class ProductDocumentResponseDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ enum: ProductDocumentType, type: String }) type: ProductDocumentType;
  @ApiProperty({ type: String }) number: string;
  @ApiProperty({ nullable: true, type: Date }) expiresAt: Date | null;
  @ApiProperty({ type: String }) filePath: string;
  @ApiProperty({ type: Date }) createdAt: Date;

  private constructor(data: ProductDocumentResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(document: ProductDocument): ProductDocumentResponseDto {
    return new ProductDocumentResponseDto({
      id: document.id,
      type: document.type,
      number: document.number,
      expiresAt: document.expiresAt,
      filePath: document.filePath,
      createdAt: document.createdAt,
    });
  }
}
