import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddProductDocumentUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/add-product-document.use-case.js';
import { ChangeChemicalProductStatusUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { FindChemicalProductByIdUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { ChangeChemicalProductStatusDto } from '@/modules/produtos-quimicos/presentation/dtos/change-chemical-product-status.dto.js';
import { ChemicalProductPageResponseDto } from '@/modules/produtos-quimicos/presentation/dtos/chemical-product-page-response.dto.js';
import { ChemicalProductResponseDto } from '@/modules/produtos-quimicos/presentation/dtos/chemical-product-response.dto.js';
import { CreateChemicalProductDto } from '@/modules/produtos-quimicos/presentation/dtos/create-chemical-product.dto.js';
import { CreateProductDocumentDto } from '@/modules/produtos-quimicos/presentation/dtos/create-product-document.dto.js';
import { ListChemicalProductsQueryDto } from '@/modules/produtos-quimicos/presentation/dtos/list-chemical-products-query.dto.js';
import { UpdateChemicalProductDto } from '@/modules/produtos-quimicos/presentation/dtos/update-chemical-product.dto.js';

@ApiTags('Produtos Químicos')
@Controller('produtos-quimicos')
@UseFilters(DomainExceptionFilter)
export class ChemicalProductsController {
  constructor(
    private readonly createProduct: CreateChemicalProductUseCase,
    private readonly listProducts: ListChemicalProductsUseCase,
    private readonly findProductById: FindChemicalProductByIdUseCase,
    private readonly updateProduct: UpdateChemicalProductUseCase,
    private readonly changeProductStatus: ChangeChemicalProductStatusUseCase,
    private readonly deleteProduct: DeleteChemicalProductUseCase,
    private readonly addDocument: AddProductDocumentUseCase,
    private readonly removeDocument: RemoveProductDocumentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo produto químico' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Código já cadastrado' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Regra de negócio violada' })
  async create(@Body() dto: CreateChemicalProductDto): Promise<ChemicalProductResponseDto> {
    const product = await this.createProduct.execute(dto);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Get()
  @ApiOperation({ summary: 'Lista produtos químicos, com filtro por classe de risco, estado físico e status' })
  @ApiResponse({ status: HttpStatus.OK, type: ChemicalProductPageResponseDto })
  async list(@Query() query: ListChemicalProductsQueryDto): Promise<ChemicalProductPageResponseDto> {
    const page = await this.listProducts.execute(query);
    return ChemicalProductPageResponseDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto químico pelo id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico não encontrado' })
  async findById(@Param('id') id: string): Promise<ChemicalProductResponseDto> {
    const product = await this.findProductById.execute(id);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados cadastrais de um produto químico' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico não encontrado' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Código já cadastrado' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Regra de negócio violada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChemicalProductDto,
  ): Promise<ChemicalProductResponseDto> {
    const product = await this.updateProduct.execute(id, dto);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Altera o status de um produto químico (ativar, inativar ou bloquear)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico não encontrado' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Transição de status inválida' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeChemicalProductStatusDto,
  ): Promise<ChemicalProductResponseDto> {
    const product = await this.changeProductStatus.execute(id, dto.status);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um produto químico e seus documentos' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteProduct.execute(id);
  }

  @Post(':id/documentos')
  @ApiOperation({ summary: 'Vincula um documento a um produto químico' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico não encontrado' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Regra de negócio violada' })
  async addProductDocument(
    @Param('id') id: string,
    @Body() dto: CreateProductDocumentDto,
  ): Promise<ChemicalProductResponseDto> {
    const product = await this.addDocument.execute(id, dto);
    return ChemicalProductResponseDto.fromEntity(product);
  }

  @Delete(':id/documentos/:documentId')
  @ApiOperation({ summary: 'Desvincula um documento de um produto químico' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'documentId' })
  @ApiResponse({ status: HttpStatus.OK, type: ChemicalProductResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto químico ou documento não encontrado' })
  async removeProductDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ): Promise<ChemicalProductResponseDto> {
    const product = await this.removeDocument.execute(id, documentId);
    return ChemicalProductResponseDto.fromEntity(product);
  }
}
