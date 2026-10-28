import { ApiProperty } from '@nestjs/swagger';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';

/** Representação de um lote exposta pela API. */
export class LotResponseDto {
  @ApiProperty({ type: String, example: '7c9e6679-7425-40de-944b-e07fc1f90ae7' })
  id: string;

  @ApiProperty({ type: String, example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  chemicalProductId: string;

  @ApiProperty({ type: String, example: 'L2026-0001' })
  lotNumber: string;

  @ApiProperty({ type: Number, example: 1500.5 })
  quantity: number;

  @ApiProperty({ enum: LotStatus, enumName: 'LotStatus', example: LotStatus.RECEIVED })
  status: LotStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'Operação que reservou o lote; preenchido apenas enquanto o status for RESERVED.',
  })
  reservedForOperationId: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description:
      'Indica se o lote pode ser movimentado por qualquer operação (status AVAILABLE). Um lote RESERVED só pode ser movimentado pela operação que o reservou.',
  })
  movable: boolean;

  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;

  private constructor(data: LotResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(lot: Lot): LotResponseDto {
    return new LotResponseDto({
      id: lot.id,
      chemicalProductId: lot.chemicalProductId,
      lotNumber: lot.lotNumber,
      quantity: lot.quantity,
      status: lot.status,
      reservedForOperationId: lot.reservedForOperationId,
      movable: lot.canBeMovedBy(),
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    });
  }
}
