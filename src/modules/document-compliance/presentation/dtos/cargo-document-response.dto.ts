import { ApiProperty, PickType } from '@nestjs/swagger';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { CreateCargoDocumentDto } from './create-cargo-document.dto.js';
import { DocumentAttachmentResponseDto } from './document-attachment.dto.js';

export class CargoDocumentResponseDto extends PickType(CreateCargoDocumentDto, [
  'cargoId',
  'shipperId',
  'compositionVersion',
] as const) {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da documentação.',
  })
  id: string;
  @ApiProperty({
    enum: CargoDocumentStatus,
    readOnly: true,
    description: 'Situação documental; não é alterada pelo CRUD de preparação.',
  })
  status: CargoDocumentStatus;
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    readOnly: true,
    description: 'Data de envio para análise.',
  })
  submittedAt: Date | null;
  @ApiProperty({
    type: [DocumentAttachmentResponseDto],
    description: 'Anexos ativos e versões preservadas no histórico.',
  })
  attachments: DocumentAttachmentResponseDto[];
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data de criação.',
  })
  createdAt: Date;
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data da última atualização.',
  })
  updatedAt: Date;

  private constructor(data: CargoDocumentResponseDto) {
    super();
    Object.assign(this, data);
  }

  static fromEntity(document: CargoDocument): CargoDocumentResponseDto {
    return new CargoDocumentResponseDto({
      id: document.id,
      cargoId: document.cargoId,
      shipperId: document.shipperId,
      compositionVersion: document.compositionVersion,
      status: document.status,
      submittedAt: document.submittedAt,
      attachments: document.attachments.map(
        DocumentAttachmentResponseDto.fromProperties,
      ),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
