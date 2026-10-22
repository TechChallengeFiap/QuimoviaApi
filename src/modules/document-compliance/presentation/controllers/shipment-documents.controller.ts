import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/create-shipment-document.use-case.js';
import { DeleteShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/delete-shipment-document.use-case.js';
import { FindShipmentDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/find-shipment-document-by-id.use-case.js';
import { ListShipmentDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/list-shipment-documents.use-case.js';
import { UpdateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/update-shipment-document.use-case.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { ShipmentDocumentValidationFilter } from '@/modules/document-compliance/presentation/filters/shipment-document-validation.filter.js';
import { CreateShipmentDocumentDto } from '@/modules/document-compliance/presentation/dtos/create-shipment-document.dto.js';
import { CreateDocumentAttachmentDto } from '@/modules/document-compliance/presentation/dtos/document-attachment.dto.js';
import { UpdateShipmentDocumentDto } from '@/modules/document-compliance/presentation/dtos/update-shipment-document.dto.js';
import { ListShipmentDocumentsQueryDto } from '@/modules/document-compliance/presentation/dtos/list-shipment-documents-query.dto.js';
import { ShipmentDocumentResponseDto } from '@/modules/document-compliance/presentation/dtos/shipment-document-response.dto.js';
import { ShipmentDocumentPageResponseDto } from '@/modules/document-compliance/presentation/dtos/shipment-document-page-response.dto.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';

const documentIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException('O identificador deve ser um UUID válido.'),
});

@ApiTags('Documentação das Cargas')
@Controller('shipment-documents')
@UseFilters(DomainExceptionFilter, ShipmentDocumentValidationFilter)
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Dados inválidos ou regra de negócio violada.',
})
export class ShipmentDocumentsController {
  constructor(
    @Inject(CreateShipmentDocumentUseCase)
    private readonly createDocument: CreateShipmentDocumentUseCase,
    @Inject(ListShipmentDocumentsUseCase)
    private readonly listDocuments: ListShipmentDocumentsUseCase,
    @Inject(FindShipmentDocumentByIdUseCase)
    private readonly findDocumentById: FindShipmentDocumentByIdUseCase,
    @Inject(UpdateShipmentDocumentUseCase)
    private readonly updateDocument: UpdateShipmentDocumentUseCase,
    @Inject(DeleteShipmentDocumentUseCase)
    private readonly deleteDocument: DeleteShipmentDocumentUseCase,
  ) {}

  @Post()
  @ApiBody({ type: CreateShipmentDocumentDto })
  @ApiOperation({
    summary: 'Cadastra a documentação de uma carga em preparação',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ShipmentDocumentResponseDto,
    description: 'Documentação criada.',
    headers: {
      Location: {
        description: 'URI da documentação criada.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe documentação para esta carga.',
  })
  async create(
    @Body(validationPipeFor(CreateShipmentDocumentDto))
    dto: CreateShipmentDocumentDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: AuthenticatedRequest,
  ): Promise<ShipmentDocumentResponseDto> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    const document = await this.createDocument.execute(
      {
        shipmentId: dto.shipmentId,
        shipperId: dto.shipperId,
        compositionVersion: dto.compositionVersion,
        attachments: dto.attachments?.map((attachment) =>
          CreateDocumentAttachmentDto.toData(attachment),
        ),
      },
      actor,
    );
    response.location(`/shipment-documents/${document.id}`);
    return ShipmentDocumentResponseDto.fromEntity(document);
  }

  @Get()
  @ApiQuery({ type: ListShipmentDocumentsQueryDto })
  @ApiOperation({
    summary:
      'Lista documentações com paginação e filtros por carga, embarcador e status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ShipmentDocumentPageResponseDto,
    description: 'Página de documentações.',
  })
  async list(
    @Query(validationPipeFor(ListShipmentDocumentsQueryDto))
    query: ListShipmentDocumentsQueryDto,
  ): Promise<ShipmentDocumentPageResponseDto> {
    return ShipmentDocumentPageResponseDto.fromPage(
      await this.listDocuments.execute(query),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta a documentação e o histórico de anexos' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador da documentação.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ShipmentDocumentResponseDto,
    description: 'Documentação encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documentação não encontrada.',
  })
  async findById(
    @Param('id', documentIdPipe) id: string,
  ): Promise<ShipmentDocumentResponseDto> {
    return ShipmentDocumentResponseDto.fromEntity(
      await this.findDocumentById.execute(id),
    );
  }

  @Patch(':id')
  @ApiBody({ type: UpdateShipmentDocumentDto })
  @ApiOperation({
    summary: 'Adiciona, substitui ou remove anexos durante a preparação',
    description:
      'Preserva o histórico. Carga, embarcador, composição, status e data de envio não podem ser alterados por este cadastro.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador da documentação.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ShipmentDocumentResponseDto,
    description: 'Documentação atualizada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documentação não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Documentação bloqueada, anexo indisponível ou alteração concorrente.',
  })
  async update(
    @Param('id', documentIdPipe) id: string,
    @Body(validationPipeFor(UpdateShipmentDocumentDto))
    dto: UpdateShipmentDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ShipmentDocumentResponseDto> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    const document = await this.updateDocument.execute(
      id,
      {
        removeAttachmentIds: dto.removeAttachmentIds,
        attachments: dto.attachments?.map((attachment) =>
          CreateDocumentAttachmentDto.toData(attachment),
        ),
      },
      actor,
    );
    return ShipmentDocumentResponseDto.fromEntity(document);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui uma documentação ainda não enviada para análise',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador da documentação.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Documentação excluída.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documentação não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Documentação bloqueada ou alterada durante a operação.',
  })
  async remove(
    @Param('id', documentIdPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    await this.deleteDocument.execute(id, actor);
  }
}
