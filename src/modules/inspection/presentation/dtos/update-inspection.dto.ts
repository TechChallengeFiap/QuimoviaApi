import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { InspectionItemResultDto } from './inspection-item-result.dto.js';

export class UpdateInspectionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    required: false,
    description:
      'Novo Fiscal responsável; não pode ser alterado depois da conclusão',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiProperty({
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    required: false,
    description:
      'Nova situação: IN_PROGRESS inicia a inspeção e COMPLETED a conclui',
    example: InspectionStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiProperty({
    type: [InspectionItemResultDto],
    required: false,
    description:
      'Resultados das verificações; só podem ser registrados com a inspeção em andamento',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((result: InspectionItemResultDto) => result.requirement)
  @ValidateNested({ each: true })
  @Type(() => InspectionItemResultDto)
  results?: InspectionItemResultDto[];
}
