import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReleaseLotDto {
  @ApiPropertyOptional({
    type: String,
    example: 'OP-2026-000123',
    maxLength: 120,
    description:
      'Identificador da operação que está retirando o lote. Obrigatório quando o lote está RESERVED, e deve ser a mesma operação da reserva.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  operationId?: string;
}
