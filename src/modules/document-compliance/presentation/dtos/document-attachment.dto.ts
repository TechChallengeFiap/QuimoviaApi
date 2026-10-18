import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type {
  CreateDocumentAttachmentData,
  DocumentAttachmentProperties,
  DocumentScope,
} from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';

class DocumentScopeDto {
  @ApiProperty({
    type: String,
    enum: ['SHIPMENT', 'SHIPMENT_ITEM'],
    description: 'Aplicação à carga inteira ou a um item da composição.',
  })
  @IsIn(['SHIPMENT', 'SHIPMENT_ITEM'], {
    message: 'O escopo deve ser SHIPMENT ou SHIPMENT_ITEM.',
  })
  type!: DocumentScope['type'];

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Obrigatório para SHIPMENT_ITEM e proibido para SHIPMENT.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('all', {
    message: 'O identificador do item deve ser um UUID válido.',
  })
  shipmentItemId?: string;
}

export class CreateDocumentAttachmentDto {
  @ApiProperty({
    type: String,
    description: 'Nome do documento.',
    example: 'Ficha de segurança',
    minLength: 1,
    maxLength: 180,
  })
  @IsString({ message: 'O nome do anexo deve ser um texto.' })
  @MinLength(1, { message: 'O nome do anexo é obrigatório.' })
  @MaxLength(180, {
    message: 'O nome do anexo deve ter no máximo 180 caracteres.',
  })
  name!: string;

  @ApiProperty({ enum: DocumentType, description: 'Categoria do documento.' })
  @IsEnum(DocumentType, { message: 'O tipo do documento é inválido.' })
  type!: DocumentType;

  @ApiProperty({
    type: String,
    description:
      'Referência opaca de um arquivo já armazenado; este endpoint não faz upload.',
    example: 'documents/safety-sheet.pdf',
    maxLength: 1024,
  })
  @IsString({ message: 'A referência do arquivo deve ser um texto.' })
  @MinLength(1, { message: 'A referência do arquivo é obrigatória.' })
  @MaxLength(1024, {
    message: 'A referência do arquivo deve ter no máximo 1024 caracteres.',
  })
  fileReference!: string;

  @ApiProperty({
    type: [DocumentScopeDto],
    description: 'Escopos atendidos pelo arquivo na composição registrada.',
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'Os escopos devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Informe pelo menos um escopo.' })
  @ArrayMaxSize(100, { message: 'Informe no máximo 100 escopos por anexo.' })
  @ValidateNested({
    each: true,
    message: 'Cada escopo deve ser um objeto válido.',
  })
  @Type(() => DocumentScopeDto)
  scopes!: DocumentScopeDto[];

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data de emissão em formato ISO 8601.',
  })
  @IsDateString(
    { strict: true },
    { message: 'A emissão deve ser uma data ISO 8601 válida.' },
  )
  issuedAt!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Data de validade; ausente ou nula quando não se aplica.',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'A validade deve ser uma data ISO 8601 válida.' },
  )
  expiresAt?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description:
      'Anexo ativo substituído; a versão anterior permanece no histórico.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('all', {
    message: 'O identificador do anexo substituído deve ser um UUID válido.',
  })
  replacesAttachmentId?: string;

  static toData(
    dto: CreateDocumentAttachmentDto,
  ): CreateDocumentAttachmentData {
    return {
      name: dto.name,
      type: dto.type,
      fileReference: dto.fileReference,
      scopes: dto.scopes,
      issuedAt: new Date(dto.issuedAt),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      replacesAttachmentId: dto.replacesAttachmentId,
    };
  }
}

/** Reutiliza os metadados do anexo e acrescenta os campos do histórico. */
export class DocumentAttachmentResponseDto extends OmitType(
  CreateDocumentAttachmentDto,
  ['replacesAttachmentId'] as const,
) {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador desta versão do anexo.',
  })
  id: string;
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    required: true,
    description: 'Data de validade, quando aplicável.',
  })
  declare expiresAt: string | null;
  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Versão anterior substituída.',
  })
  replacesAttachmentId: string | null;
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Data da retirada de uso; nula para anexos ativos.',
  })
  removedAt: Date | null;
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data do registro do anexo.',
  })
  createdAt: Date;
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data da última alteração do registro.',
  })
  updatedAt: Date;

  private constructor(data: DocumentAttachmentResponseDto) {
    super();
    Object.assign(this, data);
  }

  static fromProperties(
    attachment: DocumentAttachmentProperties,
  ): DocumentAttachmentResponseDto {
    return new DocumentAttachmentResponseDto({
      ...attachment,
      issuedAt: attachment.issuedAt.toISOString(),
      expiresAt: attachment.expiresAt?.toISOString() ?? null,
    });
  }
}
