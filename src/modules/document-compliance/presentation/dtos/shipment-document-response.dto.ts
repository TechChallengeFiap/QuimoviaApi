import { ApiProperty, PickType } from '@nestjs/swagger';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { CreateShipmentDocumentDto } from './create-shipment-document.dto.js';
import { DocumentAttachmentResponseDto } from './document-attachment.dto.js';

export class ShipmentDocumentResponseDto extends PickType(
  CreateShipmentDocumentDto,
  ['shipmentId', 'shipperId', 'compositionVersion'] as const,
) {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador da documentação.',
  })
  id: string;
  @ApiProperty({
    type: String,
    enum: ShipmentDocumentStatus,
    readOnly: true,
    description: 'Situação documental; não é alterada pelo CRUD de preparação.',
  })
  status: ShipmentDocumentStatus;
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

  private constructor(data: ShipmentDocumentResponseDto) {
    super();
    Object.assign(this, data);
  }

  static fromEntity(document: ShipmentDocument): ShipmentDocumentResponseDto {
    return new ShipmentDocumentResponseDto({
      id: document.id,
      shipmentId: document.shipmentId,
      shipperId: document.shipperId,
      compositionVersion: document.compositionVersion,
      status: document.status,
      submittedAt: document.submittedAt,
      attachments: document.attachments.map((attachment) =>
        DocumentAttachmentResponseDto.fromProperties(attachment),
      ),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
