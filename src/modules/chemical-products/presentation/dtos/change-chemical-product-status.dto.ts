import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';

/** Status que o Operador Portuário pode atribuir a um produto já cadastrado. */
export const ASSIGNABLE_PRODUCT_STATUSES = [
  ProductStatus.ACTIVE,
  ProductStatus.INACTIVE,
  ProductStatus.BLOCKED,
] as const;

export class ChangeChemicalProductStatusDto {
  @ApiProperty({
    enum: ASSIGNABLE_PRODUCT_STATUSES,
    example: ProductStatus.ACTIVE,
    description: 'Novo status do produto químico (ACTIVE, INACTIVE ou BLOCKED).',
  })
  @IsIn(ASSIGNABLE_PRODUCT_STATUSES)
  status!: ProductStatus;
}

