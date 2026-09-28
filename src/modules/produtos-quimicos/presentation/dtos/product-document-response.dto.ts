import { ApiProperty } from '@nestjs/swagger';
import { ProductDocument } from '@/modules/produtos-quimicos/domain/entities/product-document.entity.js';
import { ProductDocumentType } from '@/modules/produtos-quimicos/domain/enums/product-document-type.enum.js';

export class ProductDocumentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ProductDocumentType }) type: ProductDocumentType;
  @ApiProperty() number: string;
  @ApiProperty({ nullable: true, type: String }) expiresAt: Date | null;
  @ApiProperty() filePath: string;
  @ApiProperty() createdAt: Date;

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
