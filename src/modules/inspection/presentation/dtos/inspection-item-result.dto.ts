import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';

/** Resultado de uma verificação, informado pelo Fiscal. */
export class InspectionItemResultDto {
  @ApiProperty({
    enum: InspectionRequirement,
    enumName: 'InspectionRequirement',
    description: 'Verificação avaliada; deve estar prevista na inspeção',
    example: InspectionRequirement.NO_LEAKAGE,
  })
  @IsEnum(InspectionRequirement)
  requirement!: InspectionRequirement;

  @ApiProperty({
    enum: InspectionItemResult,
    enumName: 'InspectionItemResult',
    description: 'Resultado da verificação',
    example: InspectionItemResult.COMPLIANT,
  })
  @IsEnum(InspectionItemResult)
  result!: InspectionItemResult;

  @ApiProperty({
    type: String,
    required: false,
    maxLength: 500,
    description: 'Observação do Fiscal; obrigatória em uma não conformidade',
    example: 'Sem sinais de vazamento nos tambores.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}
