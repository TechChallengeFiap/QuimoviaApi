import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { CreateShipmentDocumentDto } from './create-shipment-document.dto.js';

export class UpdateShipmentDocumentDto extends PickType(
  CreateShipmentDocumentDto,
  ['attachments'] as const,
) {
  @ApiPropertyOptional({
    type: [String],
    maxItems: 100,
    description:
      'Identificadores dos anexos a retirar de uso, preservando seu histórico.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray({ message: 'Os identificadores dos anexos devem ser uma lista.' })
  @ArrayMaxSize(100, {
    message: 'Informe no máximo 100 remoções por requisição.',
  })
  @ArrayUnique({
    message: 'Os identificadores dos anexos não podem se repetir.',
  })
  @IsUUID('all', {
    each: true,
    message: 'Cada identificador de anexo deve ser um UUID válido.',
  })
  removeAttachmentIds?: string[];
}
