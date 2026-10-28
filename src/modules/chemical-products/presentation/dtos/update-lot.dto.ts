import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLotDto } from './create-lot.dto.js';

/**
 * Correções de recebimento, permitidas apenas enquanto o lote está em
 * conferência (RECEIVED ou UNDER_INSPECTION). O status tem endpoints próprios.
 */
export class UpdateLotDto extends PartialType(CreateLotDto) {
  @ApiPropertyOptional({ type: String, example: 'L2026-0001A', maxLength: 60 })
  declare lotNumber?: string;

  @ApiPropertyOptional({ type: Number, example: 1480 })
  declare quantity?: number;
}
