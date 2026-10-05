import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';

export class CreateInspectionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador da carga a ser inspecionada',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  cargoId!: string;

  @ApiProperty({
    type: Number,
    description: 'Versão da composição da carga que será avaliada',
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  compositionVersion!: number;

  @ApiProperty({
    enum: InspectionScope,
    enumName: 'InspectionScope',
    description: 'Escopo da inspeção: a carga inteira ou um item da carga',
    example: InspectionScope.CARGO,
  })
  @IsEnum(InspectionScope)
  scope!: InspectionScope;

  @ApiProperty({
    type: String,
    format: 'uuid',
    required: false,
    description:
      'Item da carga avaliado; obrigatório quando o escopo é CARGO_ITEM e proibido quando é CARGO',
    example: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
  })
  @IsOptional()
  @IsUUID()
  cargoItemId?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador do Fiscal responsável pela inspeção',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsUUID()
  inspectorId!: string;

  @ApiProperty({
    enum: InspectionRequirement,
    enumName: 'InspectionRequirement',
    isArray: true,
    minItems: 1,
    uniqueItems: true,
    description: 'Verificações de segurança previstas na inspeção',
    example: [
      InspectionRequirement.PACKAGING_INTEGRITY,
      InspectionRequirement.NO_LEAKAGE,
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(InspectionRequirement, { each: true })
  requirements!: InspectionRequirement[];
}
