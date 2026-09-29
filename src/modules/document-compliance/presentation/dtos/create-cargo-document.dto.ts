import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateDocumentAttachmentDto } from './document-attachment.dto.js';

export class CreateCargoDocumentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Carga à qual a documentação pertence.',
  })
  @IsUUID('all', {
    message: 'O identificador da carga deve ser um UUID válido.',
  })
  cargoId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Embarcador responsável pela documentação.',
  })
  @IsUUID('all', {
    message: 'O identificador do embarcador deve ser um UUID válido.',
  })
  shipperId!: string;

  @ApiProperty({
    minimum: 1,
    maximum: 2147483647,
    description:
      'Versão da composição à qual os escopos dos anexos se referem.',
  })
  @IsInt({ message: 'A versão da composição deve ser um número inteiro.' })
  @Min(1, { message: 'A versão da composição deve ser maior ou igual a 1.' })
  @Max(2147483647, {
    message: 'A versão da composição deve ser menor ou igual a 2147483647.',
  })
  compositionVersion!: number;

  @ApiPropertyOptional({
    type: [CreateDocumentAttachmentDto],
    maxItems: 100,
    description: 'Anexos iniciais; a preparação pode começar sem arquivos.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray({ message: 'Os anexos devem ser uma lista.' })
  @ArrayMaxSize(100, {
    message: 'Informe no máximo 100 anexos por requisição.',
  })
  @ValidateNested({
    each: true,
    message: 'Cada anexo deve ser um objeto válido.',
  })
  @Type(() => CreateDocumentAttachmentDto)
  attachments?: CreateDocumentAttachmentDto[];
}
