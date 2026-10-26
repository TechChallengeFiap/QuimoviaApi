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
  Patch,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { ValidationError } from 'class-validator';
import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { ListProductDocumentsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-product-documents.use-case.js';
import { FindProductDocumentByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-product-document-by-id.use-case.js';
import { UpdateProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-product-document.use-case.js';
import { CreateProductDocumentDto } from '@/modules/chemical-products/presentation/dtos/create-product-document.dto.js';
import { UpdateProductDocumentDto } from '@/modules/chemical-products/presentation/dtos/update-product-document.dto.js';
import { ProductDocumentResponseDto } from '@/modules/chemical-products/presentation/dtos/product-document-response.dto.js';
import { ChemicalProductResponseDto } from '@/modules/chemical-products/presentation/dtos/chemical-product-response.dto.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';

const DOCUMENT_VALIDATION = {
  exceptionFactory: (errors: ValidationError[]) =>
    new BadRequestException(
      errors.flatMap((error) =>
        Object.values(error.constraints ?? {}).map((message) =>
          message.replace(
            /property (.+) should not exist/g,
            'O campo $1 não é permitido.',
          ),
        ),
      ),
    ),
};

@ApiTags('Documentação dos Produtos Químicos')
@Controller('chemical-products/:id/documents')
@UseFilters(DomainExceptionFilter)
@ApiParam({
  name: 'id',
  description: 'Identificador do produto químico.',
  example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
})
@ApiNotFoundResponse({
  description: 'Produto químico ou documento não encontrado.',
})
@ApiBadRequestResponse({
  description: 'Dados inválidos ou regra de negócio violada.',
})
export class ProductDocumentsController {
  constructor(
    @Inject(AddProductDocumentUseCase)
    private readonly addDocument: AddProductDocumentUseCase,
    @Inject(RemoveProductDocumentUseCase)
    private readonly removeDocument: RemoveProductDocumentUseCase,
    @Inject(ListProductDocumentsUseCase)
    private readonly listDocuments: ListProductDocumentsUseCase,
    @Inject(FindProductDocumentByIdUseCase)
    private readonly findDocument: FindProductDocumentByIdUseCase,
    @Inject(UpdateProductDocumentUseCase)
    private readonly updateDocument: UpdateProductDocumentUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Vincula um documento ao produto e retorna o produto atualizado',
  })
  @ApiBody({ type: CreateProductDocumentDto })
  @ApiCreatedResponse({
    type: ChemicalProductResponseDto,
    description:
      'Documento cadastrado. O produto atualizado é retornado conforme o contrato existente.',
  })
  async create(
    @Param('id') productId: string,
    @Body(validationPipeFor(CreateProductDocumentDto, DOCUMENT_VALIDATION))
    dto: CreateProductDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    const product = await this.addDocument.execute(productId, dto, actor);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os documentos de um produto químico' })
  @ApiOkResponse({ type: [ProductDocumentResponseDto] })
  async list(
    @Param('id') productId: string,
  ): Promise<ProductDocumentResponseDto[]> {
    return (await this.listDocuments.execute(productId)).map((document) =>
      ProductDocumentResponseDto.fromEntity(document),
    );
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Consulta um documento do produto químico' })
  @ApiParam({ name: 'documentId', description: 'Identificador do documento.' })
  @ApiOkResponse({ type: ProductDocumentResponseDto })
  async findById(
    @Param('id') productId: string,
    @Param('documentId') documentId: string,
  ): Promise<ProductDocumentResponseDto> {
    return ProductDocumentResponseDto.fromEntity(
      await this.findDocument.execute(productId, documentId),
    );
  }

  @Patch(':documentId')
  @ApiOperation({
    summary: 'Atualiza os campos enviados de um documento',
    description:
      'Permite alterar tipo, número, validade e referência do arquivo. Identificadores, produto, responsável e status não são alterados.',
  })
  @ApiParam({ name: 'documentId', description: 'Identificador do documento.' })
  @ApiBody({ type: UpdateProductDocumentDto })
  @ApiOkResponse({ type: ProductDocumentResponseDto })
  async update(
    @Param('id') productId: string,
    @Param('documentId') documentId: string,
    @Body(validationPipeFor(UpdateProductDocumentDto, DOCUMENT_VALIDATION))
    dto: UpdateProductDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProductDocumentResponseDto> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    return ProductDocumentResponseDto.fromEntity(
      await this.updateDocument.execute(productId, documentId, dto, actor),
    );
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove um documento e retorna o produto atualizado',
  })
  @ApiParam({ name: 'documentId', description: 'Identificador do documento.' })
  @ApiOkResponse({
    type: ChemicalProductResponseDto,
    description:
      'Documento removido; preserva a resposta 200 com o produto atualizado.',
  })
  async remove(
    @Param('id') productId: string,
    @Param('documentId') documentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    const actor = req?.auth ? { id: req.auth.userId } : null;
    return ChemicalProductResponseDto.fromEntity(
      await this.removeDocument.execute(productId, documentId, actor),
    );
  }
}
