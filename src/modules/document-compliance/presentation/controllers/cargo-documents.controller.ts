import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/create-cargo-document.use-case.js';
import { DeleteCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/delete-cargo-document.use-case.js';
import { FindCargoDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/find-cargo-document-by-id.use-case.js';
import { ListCargoDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/list-cargo-documents.use-case.js';
import { UpdateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/update-cargo-document.use-case.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { CargoDocumentValidationFilter } from '@/modules/document-compliance/presentation/filters/cargo-document-validation.filter.js';
import { CreateCargoDocumentDto } from '@/modules/document-compliance/presentation/dtos/create-cargo-document.dto.js';
import { CreateDocumentAttachmentDto } from '@/modules/document-compliance/presentation/dtos/document-attachment.dto.js';
import { UpdateCargoDocumentDto } from '@/modules/document-compliance/presentation/dtos/update-cargo-document.dto.js';
import { ListCargoDocumentsQueryDto } from '@/modules/document-compliance/presentation/dtos/list-cargo-documents-query.dto.js';
import { CargoDocumentResponseDto } from '@/modules/document-compliance/presentation/dtos/cargo-document-response.dto.js';
import { CargoDocumentPageResponseDto } from '@/modules/document-compliance/presentation/dtos/cargo-document-page-response.dto.js';

const documentIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException('O identificador deve ser um UUID válido.'),
});

@ApiTags('Documentação das Cargas')
@Controller('cargo-documents')
@UseFilters(DomainExceptionFilter, CargoDocumentValidationFilter)
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Dados inválidos ou regra de negócio violada.',
})
export class CargoDocumentsController {
  constructor(
    private readonly createDocument: CreateCargoDocumentUseCase,
    private readonly listDocuments: ListCargoDocumentsUseCase,
    private readonly findDocumentById: FindCargoDocumentByIdUseCase,
    private readonly updateDocument: UpdateCargoDocumentUseCase,
    private readonly deleteDocument: DeleteCargoDocumentUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra a documentação de uma carga em preparação',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CargoDocumentResponseDto,
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
    @Body() dto: CreateCargoDocumentDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CargoDocumentResponseDto> {
    const document = await this.createDocument.execute({
      ...dto,
      attachments: dto.attachments?.map(CreateDocumentAttachmentDto.toData),
    });
    response.location(`/cargo-documents/${document.id}`);
    return CargoDocumentResponseDto.fromEntity(document);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista documentações com paginação e filtros por carga, embarcador e status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CargoDocumentPageResponseDto,
    description: 'Página de documentações.',
  })
  async list(
    @Query() query: ListCargoDocumentsQueryDto,
  ): Promise<CargoDocumentPageResponseDto> {
    return CargoDocumentPageResponseDto.fromPage(
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
    type: CargoDocumentResponseDto,
    description: 'Documentação encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documentação não encontrada.',
  })
  async findById(
    @Param('id', documentIdPipe) id: string,
  ): Promise<CargoDocumentResponseDto> {
    return CargoDocumentResponseDto.fromEntity(
      await this.findDocumentById.execute(id),
    );
  }

  @Patch(':id')
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
    type: CargoDocumentResponseDto,
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
    @Body() dto: UpdateCargoDocumentDto,
  ): Promise<CargoDocumentResponseDto> {
    const document = await this.updateDocument.execute(id, {
      ...dto,
      attachments: dto.attachments?.map(CreateDocumentAttachmentDto.toData),
    });
    return CargoDocumentResponseDto.fromEntity(document);
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
  async remove(@Param('id', documentIdPipe) id: string): Promise<void> {
    await this.deleteDocument.execute(id);
  }
}
