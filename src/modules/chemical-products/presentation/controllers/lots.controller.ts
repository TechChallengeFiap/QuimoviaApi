import {
  Body,
  Controller,
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
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApproveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/approve-lot.use-case.js';
import { CancelLotReservationUseCase } from '@/modules/chemical-products/application/use-cases/lots/cancel-lot-reservation.use-case.js';
import { CreateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/create-lot.use-case.js';
import { DisposeLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/dispose-lot.use-case.js';
import { ExpireLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/expire-lot.use-case.js';
import { FindLotByIdUseCase } from '@/modules/chemical-products/application/use-cases/lots/find-lot-by-id.use-case.js';
import { ListLotsUseCase } from '@/modules/chemical-products/application/use-cases/lots/list-lots.use-case.js';
import { QuarantineLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/quarantine-lot.use-case.js';
import { ReleaseLotFromQuarantineUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot-from-quarantine.use-case.js';
import { ReleaseLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot.use-case.js';
import { ReserveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/reserve-lot.use-case.js';
import { StartLotInspectionUseCase } from '@/modules/chemical-products/application/use-cases/lots/start-lot-inspection.use-case.js';
import { StoreLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/store-lot.use-case.js';
import { UpdateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/update-lot.use-case.js';
import { WithdrawLotFromStorageUseCase } from '@/modules/chemical-products/application/use-cases/lots/withdraw-lot-from-storage.use-case.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';
import { ApiStatusTransition } from '@/modules/chemical-products/presentation/decorators/api-status-transition.decorator.js';
import { CreateLotDto } from '@/modules/chemical-products/presentation/dtos/create-lot.dto.js';
import { ListLotsQueryDto } from '@/modules/chemical-products/presentation/dtos/list-lots-query.dto.js';
import { LotPageResponseDto } from '@/modules/chemical-products/presentation/dtos/lot-page-response.dto.js';
import { LotResponseDto } from '@/modules/chemical-products/presentation/dtos/lot-response.dto.js';
import { ReleaseLotDto } from '@/modules/chemical-products/presentation/dtos/release-lot.dto.js';
import { ReserveLotDto } from '@/modules/chemical-products/presentation/dtos/reserve-lot.dto.js';
import { UpdateLotDto } from '@/modules/chemical-products/presentation/dtos/update-lot.dto.js';
import { DomainError } from '@/shared/domain/errors/domain.error.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';

const PRODUCT_ID_PARAM = {
  name: 'productId',
  required: true,
  description: 'ID do produto químico dono do lote',
  example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
} as const;

const LOT_ID_PARAM = {
  name: 'lotId',
  required: true,
  description: 'ID do lote',
  example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
} as const;

const PRODUCT_NOT_FOUND_EXAMPLE = {
  message:
    'Produto químico não encontrado(a) para o identificador "3fa85f64-5717-4562-b3fc-2c963f66afa6".',
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

const LOT_NOT_FOUND_EXAMPLE = {
  message: 'Lote não encontrado(a) para o identificador "7c9e6679-7425-40de-944b-e07fc1f90ae7".',
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

const LOT_PARAMS = [PRODUCT_ID_PARAM, LOT_ID_PARAM];
const LOT_NOT_FOUND = 'Produto químico ou lote não encontrado, ou o lote não pertence ao produto.';

@ApiTags('Lotes dos Produtos Químicos')
@Controller('chemical-products/:productId/lots')
@UseFilters(DomainExceptionFilter)
export class LotsController {
  private readonly logger = new Logger(LotsController.name);

  constructor(
    @Inject(CreateLotUseCase) private readonly createLot: CreateLotUseCase,
    @Inject(ListLotsUseCase) private readonly listLots: ListLotsUseCase,
    @Inject(FindLotByIdUseCase) private readonly findLotById: FindLotByIdUseCase,
    @Inject(UpdateLotUseCase) private readonly updateLot: UpdateLotUseCase,
    @Inject(StartLotInspectionUseCase)
    private readonly startLotInspection: StartLotInspectionUseCase,
    @Inject(ApproveLotUseCase) private readonly approveLot: ApproveLotUseCase,
    @Inject(ReserveLotUseCase) private readonly reserveLot: ReserveLotUseCase,
    @Inject(CancelLotReservationUseCase)
    private readonly cancelLotReservation: CancelLotReservationUseCase,
    @Inject(StoreLotUseCase) private readonly storeLot: StoreLotUseCase,
    @Inject(WithdrawLotFromStorageUseCase)
    private readonly withdrawLotFromStorage: WithdrawLotFromStorageUseCase,
    @Inject(QuarantineLotUseCase) private readonly quarantineLot: QuarantineLotUseCase,
    @Inject(ReleaseLotFromQuarantineUseCase)
    private readonly releaseLotFromQuarantine: ReleaseLotFromQuarantineUseCase,
    @Inject(ReleaseLotUseCase) private readonly releaseLot: ReleaseLotUseCase,
    @Inject(ExpireLotUseCase) private readonly expireLot: ExpireLotUseCase,
    @Inject(DisposeLotUseCase) private readonly disposeLot: DisposeLotUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra o recebimento de um lote',
    description:
      'Cria um lote com status RECEIVED para o produto informado. Apenas produtos ACTIVE podem receber lotes, e o número do lote é único dentro do produto.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiBody({
    type: CreateLotDto,
    description: 'Dados de recebimento do lote.',
    examples: {
      padrao: {
        summary: 'Exemplo de payload válido',
        value: { lotNumber: 'L2026-0001', quantity: 1500.5 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Lote registrado com sucesso.', type: LotResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'lotNumber deve conter apenas letras, números, ponto, hífen, barra ou sublinhado',
          'quantity must be a positive number',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Produto químico não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiConflictResponse({
    description: 'Já existe um lote com esse número para o produto.',
    schema: {
      example: {
        message: 'Já existe o lote "L2026-0001" registrado para o produto "H2SO4-98".',
        error: 'Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'O produto não está ativo ou os dados violam uma regra do domínio.',
    schema: {
      example: {
        message: 'Apenas produtos ativos podem receber lotes; o produto "H2SO4-98" está UNDER_ANALYSIS.',
        error: 'Unprocessable Entity',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar o registro do lote.',
  })
  async create(
    @Param('productId') productId: string,
    @Body(validationPipeFor(CreateLotDto)) dto: CreateLotDto,
  ): Promise<LotResponseDto> {
    try {
      const lot = await this.createLot.execute(productId, dto);
      return LotResponseDto.fromEntity(lot);
    } catch (error) {
      this.handleError(error, `o registro de lote do produto químico ${productId}`);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista os lotes de um produto químico',
    description:
      'Retorna uma lista paginada dos lotes do produto, do mais recente ao mais antigo, com filtro opcional por status.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LotStatus,
    enumName: 'LotStatus',
    description: 'Filtra os lotes pelo status atual',
    example: LotStatus.AVAILABLE,
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
  @ApiOkResponse({ description: 'Lista de lotes retornada com sucesso.', type: LotPageResponseDto })
  @ApiBadRequestResponse({
    description: 'Filtros ou paginação inválidos.',
    schema: {
      example: {
        message: ['pageSize must not be greater than 100'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Produto químico não encontrado.',
    schema: { example: PRODUCT_NOT_FOUND_EXAMPLE },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a listagem dos lotes.',
  })
  async list(
    @Param('productId') productId: string,
    @Query(validationPipeFor(ListLotsQueryDto)) query: ListLotsQueryDto,
  ): Promise<LotPageResponseDto> {
    try {
      const page = await this.listLots.execute(productId, query);
      return LotPageResponseDto.fromPage(page);
    } catch (error) {
      this.handleError(error, `a listagem de lotes do produto químico ${productId}`);
    }
  }

  @Get(':lotId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Busca um lote pelo ID',
    description: 'Retorna o lote informado, desde que ele pertença ao produto da rota.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiParam(LOT_ID_PARAM)
  @ApiOkResponse({ description: 'Lote encontrado com sucesso.', type: LotResponseDto })
  @ApiNotFoundResponse({ description: LOT_NOT_FOUND, schema: { example: LOT_NOT_FOUND_EXAMPLE } })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a busca do lote.',
  })
  async findById(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    try {
      const lot = await this.findLotById.execute(productId, lotId);
      return LotResponseDto.fromEntity(lot);
    } catch (error) {
      this.handleError(error, `a busca do lote ${lotId}`);
    }
  }

  @Patch(':lotId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corrige os dados de recebimento de um lote',
    description:
      'Altera o número e/ou a quantidade do lote. Permitido apenas enquanto o lote está em conferência (RECEIVED ou UNDER_INSPECTION). O status possui endpoints próprios.',
  })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiParam(LOT_ID_PARAM)
  @ApiBody({
    type: UpdateLotDto,
    description: 'Campos a corrigir. Todos são opcionais.',
    examples: {
      quantidade: { summary: 'Corrige a quantidade conferida', value: { quantity: 1480 } },
      numero: { summary: 'Corrige o número do lote', value: { lotNumber: 'L2026-0001A' } },
    },
  })
  @ApiOkResponse({ description: 'Lote atualizado com sucesso.', type: LotResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: ['property status should not exist', 'quantity must be a positive number'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({ description: LOT_NOT_FOUND, schema: { example: LOT_NOT_FOUND_EXAMPLE } })
  @ApiConflictResponse({
    description: 'Já existe um lote com o novo número para o produto.',
    schema: {
      example: {
        message: 'Já existe o lote "L2026-0001A" registrado para este produto.',
        error: 'Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'O lote já saiu da conferência ou os dados violam uma regra do domínio.',
    schema: {
      example: {
        message:
          'Não é possível alterar a quantidade de um lote com status AVAILABLE; isso só é permitido durante a conferência.',
        error: 'Unprocessable Entity',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao processar a atualização do lote.',
  })
  async update(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
    @Body(validationPipeFor(UpdateLotDto)) dto: UpdateLotDto,
  ): Promise<LotResponseDto> {
    try {
      const lot = await this.updateLot.execute(productId, lotId, dto);
      return LotResponseDto.fromEntity(lot);
    } catch (error) {
      this.handleError(error, `a atualização do lote ${lotId}`);
    }
  }

  @Post(':lotId/start-inspection')
  @ApiStatusTransition({
    summary: 'Inicia a inspeção de um lote',
    description: 'RECEIVED -> UNDER_INSPECTION. O lote continua sem poder ser movimentado.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível iniciar a inspeção de um lote com status AVAILABLE.',
  })
  async startInspection(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'o início da inspeção', () =>
      this.startLotInspection.execute(productId, lotId),
    );
  }

  @Post(':lotId/approve')
  @ApiStatusTransition({
    summary: 'Aprova um lote',
    description: 'UNDER_INSPECTION -> AVAILABLE. A partir daqui o lote pode ser movimentado.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível aprovar um lote com status RECEIVED.',
  })
  async approve(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a aprovação', () => this.approveLot.execute(productId, lotId));
  }

  @Post(':lotId/reserve')
  @ApiBody({
    type: ReserveLotDto,
    description: 'Operação que passa a ter exclusividade sobre o lote.',
    examples: { padrao: { summary: 'Reserva para uma operação', value: { operationId: 'OP-2026-000123' } } },
  })
  @ApiBadRequestResponse({
    description: 'Identificação da operação ausente ou inválida.',
    schema: {
      example: {
        message: ['operationId should not be empty'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiStatusTransition({
    summary: 'Reserva um lote para uma operação',
    description:
      'AVAILABLE -> RESERVED. Enquanto reservado, o lote só pode ser movimentado pela operação informada.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível reservar um lote com status QUARANTINED.',
  })
  async reserve(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
    @Body(validationPipeFor(ReserveLotDto)) dto: ReserveLotDto,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a reserva', () =>
      this.reserveLot.execute(productId, lotId, dto),
    );
  }

  @Post(':lotId/cancel-reservation')
  @ApiStatusTransition({
    summary: 'Cancela a reserva de um lote',
    description: 'RESERVED -> AVAILABLE. O lote volta a poder ser movimentado por qualquer operação.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível cancelar a reserva de um lote com status AVAILABLE.',
  })
  async cancelReservation(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'o cancelamento da reserva', () =>
      this.cancelLotReservation.execute(productId, lotId),
    );
  }

  @Post(':lotId/store')
  @ApiStatusTransition({
    summary: 'Armazena um lote',
    description: 'AVAILABLE -> IN_STORAGE. Um lote armazenado não pode ser movimentado até ser retirado.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível armazenar um lote com status RESERVED.',
  })
  async store(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'o armazenamento', () => this.storeLot.execute(productId, lotId));
  }

  @Post(':lotId/withdraw-from-storage')
  @ApiStatusTransition({
    summary: 'Retira um lote do armazenamento',
    description: 'IN_STORAGE -> AVAILABLE.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível retirar do armazenamento um lote com status AVAILABLE.',
  })
  async withdrawFromStorage(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a retirada do armazenamento', () =>
      this.withdrawLotFromStorage.execute(productId, lotId),
    );
  }

  @Post(':lotId/quarantine')
  @ApiStatusTransition({
    summary: 'Coloca um lote em quarentena',
    description:
      'Isola o lote por suspeita de problema, não conformidade ou exigência legal (-> QUARANTINED). Uma reserva ativa é desfeita. Não se aplica a lotes RELEASED, EXPIRED ou DISPOSED.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível colocar em quarentena um lote com status RELEASED.',
  })
  async quarantine(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a quarentena', () =>
      this.quarantineLot.execute(productId, lotId),
    );
  }

  @Post(':lotId/release-from-quarantine')
  @ApiStatusTransition({
    summary: 'Libera um lote da quarentena',
    description: 'QUARANTINED -> AVAILABLE, após a suspeita ser afastada.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível liberar da quarentena um lote com status AVAILABLE.',
  })
  async releaseFromQuarantine(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a liberação da quarentena', () =>
      this.releaseLotFromQuarantine.execute(productId, lotId),
    );
  }

  @Post(':lotId/release')
  @ApiBody({
    type: ReleaseLotDto,
    required: false,
    description: 'Operação que está retirando o lote. Obrigatória para lotes RESERVED.',
    examples: {
      disponivel: { summary: 'Lote AVAILABLE, sem operação', value: {} },
      reservado: {
        summary: 'Lote RESERVED, pela operação que o reservou',
        value: { operationId: 'OP-2026-000123' },
      },
    },
  })
  @ApiStatusTransition({
    summary: 'Registra a saída definitiva de um lote do porto',
    description:
      '-> RELEASED (status final). Lotes AVAILABLE podem sair por qualquer operação; lotes RESERVED apenas pela operação que os reservou. Os demais status não permitem movimentação.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample:
      'O lote está reservado para a operação "OP-2026-000123" e só pode ser movimentado por ela.',
  })
  async release(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
    @Body(validationPipeFor(ReleaseLotDto)) dto: ReleaseLotDto,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'a saída', () =>
      this.releaseLot.execute(productId, lotId, dto),
    );
  }

  @Post(':lotId/expire')
  @ApiStatusTransition({
    summary: 'Marca um lote como vencido',
    description:
      '-> EXPIRED. Uma reserva ativa é desfeita. Não se aplica a lotes RELEASED ou DISPOSED.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível marcar como vencido um lote com status DISPOSED.',
  })
  async expire(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'o vencimento', () => this.expireLot.execute(productId, lotId));
  }

  @Post(':lotId/dispose')
  @ApiStatusTransition({
    summary: 'Descarta um lote',
    description:
      'QUARANTINED ou EXPIRED -> DISPOSED (status final). Descarte ou destruição conforme normas ambientais.',
    responseType: LotResponseDto,
    params: LOT_PARAMS,
    notFoundDescription: LOT_NOT_FOUND,
    notFoundExample: LOT_NOT_FOUND_EXAMPLE,
    businessRuleExample: 'Não é possível descartar um lote com status AVAILABLE.',
  })
  async dispose(
    @Param('productId') productId: string,
    @Param('lotId') lotId: string,
  ): Promise<LotResponseDto> {
    return this.transition(lotId, 'o descarte', () => this.disposeLot.execute(productId, lotId));
  }

  private async transition(
    lotId: string,
    action: string,
    run: () => Promise<{ id: string } & Parameters<typeof LotResponseDto.fromEntity>[0]>,
  ): Promise<LotResponseDto> {
    try {
      return LotResponseDto.fromEntity(await run());
    } catch (error) {
      this.handleError(error, `${action} do lote ${lotId}`);
    }
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

    throw new InternalServerErrorException(`Erro interno do servidor ao processar ${action}.`);
  }
}
