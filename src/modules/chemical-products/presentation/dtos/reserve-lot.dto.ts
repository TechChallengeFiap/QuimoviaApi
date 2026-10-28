import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReserveLotDto {
  @ApiProperty({
    type: String,
    example: 'OP-2026-000123',
    maxLength: 120,
    description: 'Identificador da operação que passa a ter exclusividade sobre o lote.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  operationId!: string;
}
