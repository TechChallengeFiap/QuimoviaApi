import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ActivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/activate-chemical-product.use-case.js';
import { BlockChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/block-chemical-product.use-case.js';
import { ChangeChemicalProductStatusUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { DeactivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/deactivate-chemical-product.use-case.js';
import { RestoreChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/restore-chemical-product.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { FindChemicalProductByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ApiStatusTransition } from '@/modules/chemical-products/presentation/decorators/api-status-transition.decorator.js';
import {
  ASSIGNABLE_PRODUCT_STATUSES,
  ChangeChemicalProductStatusDto,
} from '@/modules/chemical-products/presentation/dtos/change-chemical-product-status.dto.js';
import { ChemicalProductPageResponseDto } from '@/modules/chemical-products/presentation/dtos/chemical-product-page-response.dto.js';
import { ChemicalProductResponseDto } from '@/modules/chemical-products/presentation/dtos/chemical-product-response.dto.js';
import { CreateChemicalProductDto } from '@/modules/chemical-products/presentation/dtos/create-chemical-product.dto.js';
import { ListChemicalProductsQueryDto } from '@/modules/chemical-products/presentation/dtos/list-chemical-products-query.dto.js';
import { UpdateChemicalProductDto } from '@/modules/chemical-products/presentation/dtos/update-chemical-product.dto.js';
import { DomainError } from '@/shared/domain/errors/domain.error.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';

const PRODUCT_ID_PARAM = {
  name: 'id',
  required: true,
  description: 'ID do produto químico',
  example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
} as const;

const USER_NOT_FOUND_EXAMPLE = {
  message:
    'Usuário não encontrado(a) para o identificador "3fa85f64-5717-4562-b3fc-2c963f66afa6".',
  error: 'Not Found',
  statusCode: 404,
};

const PRODUCT_NOT_FOUND_EXAMPLE = {
  message:
    'Produto químico não encontrado(a) para o identificador "3fa85f64-5717-4562-b3fc-2c963f66afa6".',
  error: 'Not Found',
  statusCode: 404,
};

@ApiTags('Produtos Químicos')
@Controller('chemical-products')
@UseFilters(DomainExceptionFilter)
export class ChemicalProductsController {
  private readonly logger = new Logger(ChemicalProductsController.name);

  constructor(
    @Inject(CreateChemicalProductUseCase)
    private readonly createProduct: CreateChemicalProductUseCase,
    @Inject(ListChemicalProductsUseCase)
    private readonly listProducts: ListChemicalProductsUseCase,
    @Inject(FindChemicalProductByIdUseCase)
    private readonly findProductById: FindChemicalProductByIdUseCase,
    @Inject(UpdateChemicalProductUseCase)
    private readonly updateProduct: UpdateChemicalProductUseCase,
    @Inject(ChangeChemicalProductStatusUseCase)
    private readonly changeProductStatus: ChangeChemicalProductStatusUseCase,
    @Inject(ActivateChemicalProductUseCase)
    private readonly activateProduct: ActivateChemicalProductUseCase,
    @Inject(DeactivateChemicalProductUseCase)
    private readonly deactivateProduct: DeactivateChemicalProductUseCase,
    @Inject(BlockChemicalProductUseCase)
    private readonly blockProduct: BlockChemicalProductUseCase,
    @Inject(DeleteChemicalProductUseCase)
    private readonly deleteProduct: DeleteChemicalProductUseCase,
    @Inject(RestoreChemicalProductUseCase)
    private readonly restoreProduct: RestoreChemicalProductUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastra um novo produto químico',
    description:
      'Cria um novo registro de produto químico. Se o status não for informado, o produto nasce com status UNDER_ANALYSIS. Documentos podem ser enviados junto com o cadastro.',
  })
  @ApiBody({
    type: CreateChemicalProductDto,
    description: 'Dados necessários para o cadastro do produto químico.',
    examples: {
      padrao: {
        summary: 'Exemplo de payload válido',
        description: 'Payload com os dados mínimos obrigatórios para criar o produto químico.',
        value: {
          code: 'H2SO4-98',
          technicalName: 'Ácido sulfúrico',
          tradeName: 'Sulfurax 98',
          unNumber: '1830',
          riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
          physicalState: ProductPhysicalState.LIQUID,
          responsibleUserId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
      },
      comDocumentos: {
        summary: 'Exemplo com status inicial e documentos',
        description: 'Payload completo, com status inicial ACTIVE e um documento vinculado.',
        value: {
          code: 'NH3-01',
          technicalName: 'Amônia anidra',
          unNumber: '1005',
          riskClass: ProductRiskClass.GASES,
          physicalState: ProductPhysicalState.GASEOUS,
          status: ProductStatus.ACTIVE,
          responsibleUserId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          documents: [
            {
              type: 'SAFETY_DATA_SHEET',
              number: 'FISPQ-2026-0001',
              expiresAt: '2027-12-31T00:00:00.000Z',
              filePath: 'documentos/produtos/amonia/fispq.pdf',
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Produto químico cadastrado com sucesso.',
    type: ChemicalProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'code must be longer than or equal to 1 characters',
          'technicalName must be longer than or equal to 3 characters',
          'unNumber deve conter exatamente 4 dígitos',
          'riskClass must be one of the following values: EXPLOSIVES, GASES, FLAMMABLE_LIQUIDS, FLAMMABLE_SOLIDS, OXIDIZING_SUBSTANCES, TOXIC_SUBSTANCES, RADIOACTIVE_MATERIALS, CORROSIVE_SUBSTANCES, MISCELLANEOUS_DANGEROUS_SUBSTANCES',
          'physicalState must be one of the following values: SOLID, LIQUID, GASEOUS',
          'responsibleUserId should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário responsável não encontrado.',
    schema: { example: USER_NOT_FOUND_EXAMPLE },
  })
  @ApiConflictResponse({
    description: 'Já existe um produto químico com o código informado.',
    schema: {
      example: {
        message: 'Já existe um produto químico cadastrado com o código "H2SO4-98".',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Uma regra de negócio do domínio foi violada.',
    schema: {
      example: {
        message: 'O código "H2 SO4" não é válido: use apenas letras, números, ponto, hífen ou sublinhado.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar o cadastro do produto químico.',
  })
  async create(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        expectedType: CreateChemicalProductDto,
      }),
    )
    dto: CreateChemicalProductDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const actor = req?.auth ? { id: req.auth.userId } : null;
      const product = await this.createProduct.execute(dto, actor);
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, 'o cadastro do produto químico');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista os produtos químicos, com filtro por classe de risco, estado físico e status',
    description:
      'Retorna uma lista paginada de produtos químicos, ordenada do mais recente para o mais antigo. Todos os filtros são opcionais.',
  })
  @ApiQuery({
    name: 'riskClass',
    required: false,
    description: 'Filtra os produtos químicos pela classe de risco',
    enum: ProductRiskClass,
    example: ProductRiskClass.CORROSIVE_SUBSTANCES,
  })
  @ApiQuery({
    name: 'physicalState',
    required: false,
    description: 'Filtra os produtos químicos pelo estado físico',
    enum: ProductPhysicalState,
    example: ProductPhysicalState.LIQUID,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtra os produtos químicos pelo status atual',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @ApiQuery({
    name: 'responsibleUserId',
    required: false,
    type: String,
    description: 'Filtra os produtos químicos pelo ID do usuário responsável',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página desejada',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Quantidade de registros por página (máximo 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Lista de produtos químicos retornada com sucesso.',
    type: ChemicalProductPageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou paginação inválidos.',
    schema: {
      example: {
        message: [
          'status must be one of the following values: ACTIVE, INACTIVE, BLOCKED, UNDER_ANALYSIS',
          'pageSize must not be greater than 100',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a listagem dos produtos químicos.',
  })
  async list(
    @Query(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        expectedType: ListChemicalProductsQueryDto,
      }),
    )
    query: ListChemicalProductsQueryDto,
  ): Promise<ChemicalProductPageResponseDto> {
    try {
      const page = await this.listProducts.execute(query);
      return ChemicalProductPageResponseDto.fromPage(page);
    } catch (error) {
      this.handleError(error, 'a listagem dos produtos químicos');
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Busca um produto químico pelo ID',
    description: 'Retorna o produto químico e seus documentos vinculados.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiOkResponse({
    description: 'Produto químico encontrado com sucesso.',
    type: ChemicalProductResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Produto químico não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a busca do produto químico.',
  })
  async findById(@Param('id') id: string): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.findProductById.execute(id);
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a busca do produto químico com ID ${id}`);
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualiza os dados cadastrais de um produto químico',
    description:
      'Altera apenas os campos enviados, incluindo a troca do usuário responsável. O status e os documentos possuem endpoints próprios e não são aceitos aqui.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiBody({
    type: UpdateChemicalProductDto,
    description: 'Campos cadastrais a alterar. Todos são opcionais.',
    examples: {
      padrao: {
        summary: 'Exemplo de payload válido',
        description: 'Altera o nome técnico, remove o nome comercial e corrige o número ONU.',
        value: {
          technicalName: 'Ácido sulfúrico concentrado',
          tradeName: null,
          unNumber: '1831',
        },
      },
      trocaResponsavel: {
        summary: 'Troca o usuário responsável',
        value: { responsibleUserId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Produto químico atualizado com sucesso.',
    type: ChemicalProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: ['property status should not exist', 'unNumber deve conter exatamente 4 dígitos'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Produto químico ou usuário responsável não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiConflictResponse({
    description: 'Já existe outro produto químico com o código informado.',
    schema: {
      example: {
        message: 'Já existe um produto químico cadastrado com o código "NH3-01".',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Uma regra de negócio do domínio foi violada.',
    schema: {
      example: {
        message: 'O nome técnico do produto químico deve ter ao menos 3 caracteres.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a atualização do produto químico.',
  })
  async update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        expectedType: UpdateChemicalProductDto,
      }),
    )
    dto: UpdateChemicalProductDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const actor = req?.auth ? { id: req.auth.userId } : null;
      const product = await this.updateProduct.execute(id, dto, actor);
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a atualização do produto químico com ID ${id}`);
    }
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera o status de um produto químico',
    description:
      'Permite ao Operador Portuário ativar (ACTIVE), inativar (INACTIVE) ou bloquear (BLOCKED) um produto químico. UNDER_ANALYSIS é apenas o status inicial e não pode ser atribuído por aqui.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiBody({
    type: ChangeChemicalProductStatusDto,
    description: `Novo status do produto. Valores aceitos: ${ASSIGNABLE_PRODUCT_STATUSES.join(', ')}.`,
    examples: {
      ativar: {
        summary: 'Ativar o produto',
        value: { status: ProductStatus.ACTIVE },
      },
      inativar: {
        summary: 'Inativar o produto',
        value: { status: ProductStatus.INACTIVE },
      },
      bloquear: {
        summary: 'Bloquear o produto',
        value: { status: ProductStatus.BLOCKED },
      },
    },
  })
  @ApiOkResponse({
    description: 'Status do produto químico alterado com sucesso.',
    type: ChemicalProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Status inválido ou não permitido.',
    schema: {
      example: {
        message: ['status must be one of the following values: ACTIVE, INACTIVE, BLOCKED'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Produto químico não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a alteração de status do produto químico.',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        expectedType: ChangeChemicalProductStatusDto,
      }),
    )
    dto: ChangeChemicalProductStatusDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.changeProductStatus.execute(
        id,
        dto.status,
        ChemicalProductsController.actorOf(req),
      );
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a alteração de status do produto químico com ID ${id}`);
    }
  }

  @Post(':id/activate')
  @ApiStatusTransition({
    summary: 'Ativa um produto químico',
    description:
      'Coloca o produto em ACTIVE, liberando-o para uso em novas operações e para o recebimento de lotes (Operador Portuário). Um produto já ativo é devolvido sem alteração.',
    responseType: ChemicalProductResponseDto,
    params: [PRODUCT_ID_PARAM],
    notFoundDescription: 'Produto químico não encontrado.',
    notFoundExample: PRODUCT_NOT_FOUND_EXAMPLE,
  })
  async activate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.activateProduct.execute(id, ChemicalProductsController.actorOf(req));
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a ativação do produto químico com ID ${id}`);
    }
  }

  @Post(':id/deactivate')
  @ApiStatusTransition({
    summary: 'Inativa um produto químico',
    description:
      'Coloca o produto em INACTIVE, impedindo seu uso em novas operações (Operador Portuário). Um produto já inativo é devolvido sem alteração.',
    responseType: ChemicalProductResponseDto,
    params: [PRODUCT_ID_PARAM],
    notFoundDescription: 'Produto químico não encontrado.',
    notFoundExample: PRODUCT_NOT_FOUND_EXAMPLE,
  })
  async deactivate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.deactivateProduct.execute(id, ChemicalProductsController.actorOf(req));
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a inativação do produto químico com ID ${id}`);
    }
  }

  @Post(':id/block')
  @ApiStatusTransition({
    summary: 'Bloqueia um produto químico',
    description:
      'Coloca o produto em BLOCKED, por exemplo por pendência legal ou de segurança (Operador Portuário). Um produto já bloqueado é devolvido sem alteração.',
    responseType: ChemicalProductResponseDto,
    params: [PRODUCT_ID_PARAM],
    notFoundDescription: 'Produto químico não encontrado.',
    notFoundExample: PRODUCT_NOT_FOUND_EXAMPLE,
  })
  async block(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.blockProduct.execute(id, ChemicalProductsController.actorOf(req));
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `o bloqueio do produto químico com ID ${id}`);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui um produto químico (exclusão lógica)',
    description:
      'Marca o produto como excluído (soft delete). O registro é preservado para não quebrar cargas químicas, lotes e históricos que o referenciam, mas deixa de aparecer nas buscas e listagens. Não é permitido quando há lotes em aberto. A exclusão pode ser desfeita em POST /chemical-products/{id}/restore.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiNoContentResponse({ description: 'Produto químico excluído com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Produto químico não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiUnprocessableEntityResponse({
    description: 'O produto possui lotes em aberto.',
    schema: {
      example: {
        message:
          'Não é possível excluir um produto químico com lotes em aberto; conclua ou descarte os lotes antes.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a exclusão do produto químico.',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      await this.deleteProduct.execute(id, ChemicalProductsController.actorOf(req));
    } catch (error) {
      this.handleError(error, `a exclusão do produto químico com ID ${id}`);
    }
  }

  @Post(':id/restore')
  @ApiStatusTransition({
    summary: 'Restaura um produto químico excluído',
    description:
      'Desfaz a exclusão lógica e devolve o produto ao catálogo, com o mesmo status que tinha antes da exclusão.',
    responseType: ChemicalProductResponseDto,
    params: [PRODUCT_ID_PARAM],
    notFoundDescription: 'Produto químico não encontrado.',
    notFoundExample: PRODUCT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'O produto químico não está excluído.',
  })
  async restore(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChemicalProductResponseDto> {
    try {
      const product = await this.restoreProduct.execute(id, ChemicalProductsController.actorOf(req));
      return ChemicalProductResponseDto.fromEntity(product);
    } catch (error) {
      this.handleError(error, `a restauração do produto químico com ID ${id}`);
    }
  }

  /** Ator das ações para o log de auditoria: o usuário da sessão, quando a rota é autenticada. */
  private static actorOf(req: AuthenticatedRequest | undefined) {
    return req?.auth ? { id: req.auth.userId } : null;
  }

  /**
   * Erros de domínio e HTTP são esperados (404, 409, 422...) e seguem para o
   * DomainExceptionFilter e para o Nest. Qualquer outro erro é registrado com
   * stack trace e convertido em 500, sem vazar detalhes internos.
   */
  private handleError(error: unknown, action: string): never {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof HttpException || error instanceof DomainError) {
      this.logger.warn(`Falha ao processar ${action}: ${message}`);
      throw error;
    }

    this.logger.error(
      `Erro ao processar ${action}: ${message}`,
      error instanceof Error ? error.stack : undefined,
    );

    throw new InternalServerErrorException(
      `Erro interno do servidor ao processar ${action}.`,
    );
  }
}
