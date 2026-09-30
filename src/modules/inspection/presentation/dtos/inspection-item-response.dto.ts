import { ApiProperty } from '@nestjs/swagger';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionItem } from '@/modules/inspection/domain/value-objects/inspection-item.vo.js';

/** Verificação prevista na inspeção, com o resultado registrado. */
export class InspectionItemResponseDto {
  @ApiProperty({
    enum: InspectionRequirement,
    enumName: 'InspectionRequirement',
    description: 'Verificação de segurança prevista',
    example: InspectionRequirement.NO_LEAKAGE,
  })
  requirement: InspectionRequirement;

  @ApiProperty({
    enum: InspectionItemResult,
    enumName: 'InspectionItemResult',
    nullable: true,
    description:
      'Resultado registrado pelo Fiscal; nulo enquanto não verificado',
    example: InspectionItemResult.COMPLIANT,
  })
  result: InspectionItemResult | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Observação do Fiscal; obrigatória em uma não conformidade',
    example: 'Sem sinais de vazamento nos tambores.',
  })
  observation: string | null;

  private constructor(data: InspectionItemResponseDto) {
    Object.assign(this, data);
  }

  static fromValueObject(item: InspectionItem): InspectionItemResponseDto {
    return new InspectionItemResponseDto(item.toObject());
  }
}
