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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/user/infrastructure/auth/authenticated-request.js';
import { OptionalAuthGuard } from '@/modules/user/infrastructure/auth/optional-auth.guard.js';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.js';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.js';
import { ChemicalShipmentPageResponseDto } from '../dtos/chemical-shipment-page-response.dto.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { ListChemicalShipmentsQueryDto } from '../dtos/list-chemical-shipment-query.dto.js';
import { ListChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/list-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.js';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { DomainError } from '@/shared/domain/errors/domain.error.js';
import { UpdateChemicalShipmentDto } from '../dtos/update-chemical-shipment.dto.js';
import { UpdateChemicalShipmentUseCase } from '../../application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '../../application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';
import { ChangeChemicalShipmentStatusDto } from '../dtos/change-chemical-shipment-status.dto.js';
import { ShipmentTransitionsResponseDto } from '../dtos/shipment-transitions-response.dto.js';
import { ChangeChemicalShipmentStatusUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/change-chemical-shipment-status.use-case.js';
import { ReleaseChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/release-chemical-shipment.use-case.js';
import { BlockChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/block-chemical-shipment.use-case.js';
import { CancelChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/cancel-chemical-shipment.use-case.js';

@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
@UseFilters(DomainExceptionFilter)
@UseGuards(OptionalAuthGuard)
export class ChemicalShipmentController {
  private readonly logger = new Logger(ChemicalShipmentController.name);

  constructor(
    @Inject(CreateChemicalShipmentUseCase)
    private readonly createChemicalShipmentUseCase: CreateChemicalShipmentUseCase,
    @Inject(ListChemicalShipmentUseCase)
    private readonly listChemicalShipmentsUseCase: ListChemicalShipmentUseCase,
    @Inject(FindChemicalShipmentByIdUseCase)
    private readonly findChemicalShipmentByIdUseCase: FindChemicalShipmentByIdUseCase,
    @Inject(UpdateChemicalShipmentUseCase)
    private readonly updateChemicalShipmentUseCase: UpdateChemicalShipmentUseCase,
    @Inject(DeleteChemicalShipmentUseCase)
    private readonly deleteChemicalShipmentUseCase: DeleteChemicalShipmentUseCase,
    @Inject(ChangeChemicalShipmentStatusUseCase)
    private readonly changeStatusUseCase: ChangeChemicalShipmentStatusUseCase,
    @Inject(ReleaseChemicalShipmentUseCase)
    private readonly releaseUseCase: ReleaseChemicalShipmentUseCase,
    @Inject(BlockChemicalShipmentUseCase)
    private readonly blockUseCase: BlockChemicalShipmentUseCase,
    @Inject(CancelChemicalShipmentUseCase)
    private readonly cancelUseCase: CancelChemicalShipmentUseCase,
  ) {}

  private static actorFrom(req?: AuthenticatedRequest | null) {
    return req?.auth ? { id: req.auth.userId } : null;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar nova carga química',
    description:
      'Cria um novo registro de carga química com status inicial REGISTERED.',
  })
  @ApiBody({
    type: CreateChemicalShipmentDTO,
    description: 'Dados necessários para o cadastro da carga química.',
    examples: {
      completo: {
        summary: 'Exemplo com todos os atributos do edital',
        description:
          'Payload com código da carga, produto, quantidade, unidade, origem, destino, data de entrada, responsável e documentação',
        value: {
          code: 'CARGO-2026-001',
          productId: 'prod-001',
          quantityProduct: 1500,
          unit: 'toneladas',
          origin: 'Porto de Santos - Terminal Químico',
          destination: 'Terminal Industrial Mauá',
          entryDate: '2026-10-24T12:00:00.000Z',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        },
      },
      minimo: {
        summary: 'Exemplo com campos mínimos (demais campos gerados com defaults)',
        description:
          'Payload mínimo: campos code, unit, origin, destination e entryDate assumem padrões do sistema',
        value: {
          productId: 'prod-001',
          quantityProduct: 100,
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Carga química cadastrada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'O productId não pode estar vazio',
          'O productId deve ser uma string',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário responsável não encontrado.',
    schema: {
      example: {
        message: 'Usuário não encontrado(a) para o identificador "user-001".',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Já existe uma carga química cadastrada com o código fornecido.',
    schema: {
      example: {
        message:
          'Já existe uma carga química cadastrada com o código "CARGO-2026-001".',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Erro interno do servidor ao processar a criação da carga química.',
  })
  async createChemicalShipment(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        expectedType: CreateChemicalShipmentDTO,
      }),
    )
    chemicalShipment: CreateChemicalShipmentDTO,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    try {
      const actor = req?.auth ? { id: req.auth.userId } : null;
      const shipment =
        await this.createChemicalShipmentUseCase.execute(chemicalShipment, actor);
      return ChemicalShipmentResponseDto.fromEntity(shipment);
    } catch (error) {
      this.logger.error(
        `Erro ao criar carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException || error instanceof DomainError) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno do servidor ao processar a criação da carga química.',
      );
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lista as cargas químicas, com filtro por status, produto, usuário responsável e documentos',
    description:
      'Retorna uma lista paginada de cargas químicas. Permite filtrar por status, ID do produto, usuário responsável e ID dos documentos.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtra as cargas químicas pelo status atual',
    enum: StatusShipment,
    example: StatusShipment.ANALYZING,
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Filtra as cargas químicas pelo identificador do produto',
  })
  @ApiQuery({
    name: 'responsibleUserId',
    required: false,
    description:
      'Filtra as cargas químicas pelo identificador do usuário responsável',
  })
  @ApiQuery({
    name: 'documentsIds',
    required: false,
    description:
      'Filtra as cargas químicas pelo identificador do documento anexado',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página desejada',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Quantidade de registros por página',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cargas químicas retornada com sucesso.',
    type: ChemicalShipmentPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Erro interno do servidor ao processar a listagem das cargas químicas.',
  })
  async listChemicalShipments(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        expectedType: ListChemicalShipmentsQueryDto,
      }),
    )
    query: ListChemicalShipmentsQueryDto,
  ): Promise<ChemicalShipmentPageResponseDto> {
    try {
      const page = await this.listChemicalShipmentsUseCase.execute(query);
      return ChemicalShipmentPageResponseDto.fromPage(page);
    } catch (error) {
      this.logger.error(
        `Erro ao listar cargas químicas: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException || error instanceof DomainError) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno do servidor ao processar a listagem das cargas químicas.',
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '1234567890a1b2c3d4e5f6',
  })
  @ApiOperation({
    summary: 'Busca uma carga química pelo ID',
    description: 'Retorna uma carga química pelo ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carga química encontrada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Carga química não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Erro interno do servidor ao processar a busca da carga química.',
  })
  async findChemicalShipmentById(
    @Param('id') id: string,
  ): Promise<ChemicalShipmentResponseDto> {
    try {
      const shipment = await this.findChemicalShipmentByIdUseCase.execute(id);
      return ChemicalShipmentResponseDto.fromEntity(shipment);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar carga química com ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException || error instanceof DomainError) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno do servidor ao processar a busca da carga química.',
      );
    }
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '1234567890a1b2c3d4e5f6',
  })
  @ApiBody({
    type: UpdateChemicalShipmentDto,
    description: 'Dados necessários para a atualização da carga química.',
    examples: {
      padrao: {
        summary: 'Exemplo de payload de atualização válido',
        description:
          'Payload atualizando quantidade, unidade de medida, origem, destino ou código da carga',
        value: {
          quantityProduct: 250,
          unit: 'toneladas',
          origin: 'Porto de Santos - Cais do Saboó',
          destination: 'Terminal Químico de Cubatão',
          documentsIds: 'DOC-456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Carga química atualizada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'O productId não pode estar vazio',
          'O productId deve ser uma string',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Você não tem permissão para realizar esta ação.',
    schema: {
      example: {
        message: ['Você não tem permissão para realizar esta ação.'],
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
    schema: {
      example: {
        message: ['Carga química não encontrada.'],
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Já existe uma carga química cadastrada com o código fornecido.',
    schema: {
      example: {
        message:
          'Já existe uma carga química cadastrada com o código "CARGO-2026-001".',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  async updateChemicalShipment(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateChemicalShipmentDto))
    updateChemicalShipmentDto: UpdateChemicalShipmentDto,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    try {
      const actor = req?.auth ? { id: req.auth.userId } : null;
      const updatedShipment = await this.updateChemicalShipmentUseCase.execute(
        id,
        updateChemicalShipmentDto,
        actor,
      );

      return ChemicalShipmentResponseDto.fromEntity(updatedShipment);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar carga química com ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException || error instanceof DomainError) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno do servidor ao processar a atualização da carga química.',
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '1234567890a1b2c3d4e5f6',
  })
  @ApiOperation({
    summary: 'Remove uma carga química',
    description: 'Remove uma carga química pelo ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carga química removida com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Carga química não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Erro interno do servidor ao processar a remoção da carga química.',
  })
  async deleteChemicalShipment(
    @Param('id') id: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<void> {
    try {
      const actor = req?.auth ? { id: req.auth.userId } : null;
      await this.deleteChemicalShipmentUseCase.execute(id, actor);
    } catch (error) {
      this.logger.error(
        `Erro ao remover carga química com ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException || error instanceof DomainError) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno do servidor ao processar a remoção da carga química.',
      );
    }
  }

  @Get(':id/transitions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar transições permitidas para a carga química',
    description:
      'Retorna o status atual da carga, seu rótulo legível, se é terminal e a lista de transições permitidas.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
  })
  @ApiOkResponse({
    description: 'Transições permitidas retornadas com sucesso.',
    type: ShipmentTransitionsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
  })
  async getTransitions(
    @Param('id') id: string,
  ): Promise<ShipmentTransitionsResponseDto> {
    const shipment = await this.findChemicalShipmentByIdUseCase.execute(id);
    return ShipmentTransitionsResponseDto.fromEntity(shipment);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alterar o status da carga química',
    description:
      'Fluxo principal: REGISTERED → ANALYZING → INSPECTION → APPROVED → IN_TRANSIT → COMPLETED. ' +
      'Alternativos: REGISTERED/ANALYZING/INSPECTION/APPROVED/REPROVED → CANCELLED; INSPECTION → REPROVED. ' +
      'COMPLETED e CANCELLED são terminais. APPROVED exige documentação obrigatória válida.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
  })
  @ApiBody({
    type: ChangeChemicalShipmentStatusDto,
    description: 'Novo status desejado para a carga química.',
    examples: {
      analise: {
        summary: 'Registrada → Em análise',
        value: { status: StatusShipment.ANALYZING },
      },
      inspecao: {
        summary: 'Em análise → Em inspeção',
        value: { status: StatusShipment.INSPECTION },
      },
      liberada: {
        summary: 'Em inspeção → Liberada (requer documentação)',
        value: { status: StatusShipment.APPROVED },
      },
      movimentacao: {
        summary: 'Liberada → Em movimentação',
        value: { status: StatusShipment.IN_TRANSIT },
      },
      finalizada: {
        summary: 'Em movimentação → Finalizada',
        value: { status: StatusShipment.COMPLETED },
      },
      cancelada: {
        summary: 'Cancelamento a partir de status permitido',
        value: { status: StatusShipment.CANCELLED },
      },
    },
  })
  @ApiOkResponse({
    description: 'Status da carga química alterado com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Status fornecido fora do enum permitido.',
    schema: {
      example: {
        statusCode: 400,
        message: ['O status da carga química é inválido.'],
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Carga Química não encontrado(a) para o identificador "3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70".',
        error: 'Not Found',
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Transição proibida pela regra de negócio ou documentação ausente.',
    schema: {
      example: {
        statusCode: 422,
        message: 'Uma carga bloqueada não pode entrar em movimentação.',
        error: 'Unprocessable Entity',
      },
    },
  })
  async changeStatus(
    @Param('id') id: string,
    @Body(validationPipeFor(ChangeChemicalShipmentStatusDto))
    dto: ChangeChemicalShipmentStatusDto,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    const shipment = await this.changeStatusUseCase.execute(
      id,
      dto.status,
      ChemicalShipmentController.actorFrom(req),
    );
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }

  @Patch(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liberar carga química',
    description:
      'Transição especializada de Em inspeção (INSPECTION) para Liberada (APPROVED). Exige documentação obrigatória válida e vigente.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
  })
  @ApiOkResponse({
    description: 'Carga química liberada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Documentação obrigatória ausente/inválida ou transição proibida.',
    schema: {
      example: {
        statusCode: 422,
        message: 'Uma carga não pode ser liberada sem documentação obrigatória.',
        error: 'Unprocessable Entity',
      },
    },
  })
  async release(
    @Param('id') id: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    const shipment = await this.releaseUseCase.execute(
      id,
      ChemicalShipmentController.actorFrom(req),
    );
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }

  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bloquear carga química',
    description:
      'Transição especializada de Em inspeção (INSPECTION) para Bloqueada (REPROVED). Cargas bloqueadas não podem entrar em movimentação.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
  })
  @ApiOkResponse({
    description: 'Carga química bloqueada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Transição proibida.',
    schema: {
      example: {
        statusCode: 422,
        message:
          'Transição de status inválida: "Liberada" → "Bloqueada". A partir de "Liberada" são permitidos: "Cancelada".',
        error: 'Unprocessable Entity',
      },
    },
  })
  async block(
    @Param('id') id: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    const shipment = await this.blockUseCase.execute(
      id,
      ChemicalShipmentController.actorFrom(req),
    );
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar carga química',
    description:
      'Transição especializada para Cancelada (CANCELLED). Permitido a partir de Registrada, Em análise, Em inspeção, Liberada e Bloqueada. Estados terminais não podem ser cancelados.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da carga química',
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
  })
  @ApiOkResponse({
    description: 'Carga química cancelada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Carga química não encontrada.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Carga já finalizada ou cancelada.',
    schema: {
      example: {
        statusCode: 422,
        message:
          'Uma carga cancelada não pode ser reativada nem sofrer novas alterações de status.',
        error: 'Unprocessable Entity',
      },
    },
  })
  async cancel(
    @Param('id') id: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<ChemicalShipmentResponseDto> {
    const shipment = await this.cancelUseCase.execute(
      id,
      ChemicalShipmentController.actorFrom(req),
    );
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }
}
