import { ApiProperty, PickType } from '@nestjs/swagger';
import type { ShipmentDocumentDetails } from '@/modules/document-compliance/application/dto/shipment-document-details.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { CreateShipmentDocumentDto } from './create-shipment-document.dto.js';
import { DocumentAttachmentResponseDto } from './document-attachment.dto.js';

class ShipmentDocumentResponsibleUserDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'bb113c8c-b2bf-49b5-8d6b-b456c49aca5d',
  })
  id!: string;

  @ApiProperty({ type: String, example: 'Maria Silva' })
  name!: string;
}

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
    format: 'uuid',
    nullable: true,
    description:
      'Identificador do responsável técnico; nulo quando não associado.',
  })
  responsibleUserId: string | null;
  @ApiProperty({
    type: ShipmentDocumentResponsibleUserDto,
    nullable: true,
    description:
      'Identificador e nome do responsável técnico; nulo quando não associado ou indisponível.',
  })
  responsibleUser: ShipmentDocumentResponsibleUserDto | null;
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

  static fromDetails(
    document: ShipmentDocumentDetails,
  ): ShipmentDocumentResponseDto {
    return new ShipmentDocumentResponseDto({
      id: document.id,
      shipmentId: document.shipmentId,
      shipperId: document.shipperId,
      responsibleUserId: document.responsibleUserId,
      responsibleUser: document.responsibleUser,
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
