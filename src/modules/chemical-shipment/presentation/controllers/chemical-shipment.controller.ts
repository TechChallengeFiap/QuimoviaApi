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
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.js';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.js';
import { ChemicalShipmentPageResponseDto } from '../dtos/chemical-shipment-page-response.dto.js';
import { ListChemicalShipmentsQueryDto } from '../dtos/list-chemical-shipment-query.dto.js';
import { ListChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/list-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.js';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { DomainError } from '@/shared/domain/errors/domain.error.js';
import { UpdateChemicalShipmentDto } from '../dtos/update-chemical-shipment.dto.js';
import { UpdateChemicalShipmentUseCase } from '../../application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '../../application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';
@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
@UseFilters(DomainExceptionFilter)
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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar nova carga química',
    description:
      'Cria um novo registro de carga química com status inicial ANALYZING.',
  })
  @ApiBody({
    type: CreateChemicalShipmentDTO,
    description: 'Dados necessários para o cadastro da carga química.',
    examples: {
      padrao: {
        summary: 'Exemplo de payload válido',
        description:
          'Payload com dados mínimos obrigatórios para criar a carga química',
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
  ): Promise<ChemicalShipmentResponseDto> {
    try {
      const shipment =
        await this.createChemicalShipmentUseCase.execute(chemicalShipment);
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
      padrão: {
        summary: 'Exemplo de payload válido',
        description:
          'Payload com dados mínimos obrigatórios para atualizar a carga química',
        value: {
          status: StatusShipment.APPROVED,
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
  async updateChemicalShipment(
    @Param('id') id: string,
    @Body() updateChemicalShipmentDto: UpdateChemicalShipmentDto,
  ): Promise<ChemicalShipmentResponseDto> {
    try {
      const updatedShipment = await this.updateChemicalShipmentUseCase.execute(
        id,
        updateChemicalShipmentDto,
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
  async deleteChemicalShipment(@Param('id') id: string): Promise<void> {
    try {
      await this.deleteChemicalShipmentUseCase.execute(id);
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
}
