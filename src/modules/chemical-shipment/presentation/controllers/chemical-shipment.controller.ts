import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.ts';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.ts';
import { ChemicalShipmentPageResponseDto } from '../dtos/chemical-shipment-page-response.dto.ts';
import { ListChemicalShipmentsQueryDto } from '../dtos/list-chemical-shipment-query.dto.ts';
import { ListChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/list-chemical-shipment.use-case.ts';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.ts';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.ts';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.ts';

@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
@UseFilters(DomainExceptionFilter)
export class ChemicalShipmentController {
  constructor(
    @Inject(CreateChemicalShipmentUseCase)
    private readonly createChemicalShipmentUseCase: CreateChemicalShipmentUseCase,
    @Inject(ListChemicalShipmentUseCase)
    private readonly listChemicalShipmentsUseCase: ListChemicalShipmentUseCase,
    @Inject(FindChemicalShipmentByIdUseCase)
    private readonly findChemicalShipmentByIdUseCase: FindChemicalShipmentByIdUseCase,
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
    const shipment =
      await this.createChemicalShipmentUseCase.execute(chemicalShipment);
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista as cargas químicas, com filtro por status, produto, usuário responsável e documentos',
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
    description: 'Filtra as cargas químicas pelo identificador do usuário responsável',
  })
  @ApiQuery({
    name: 'documentsIds',
    required: false,
    description: 'Filtra as cargas químicas pelo identificador do documento anexado',
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
    const page = await this.listChemicalShipmentsUseCase.execute(query);
    return ChemicalShipmentPageResponseDto.fromPage(page);
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
    const shipment = await this.findChemicalShipmentByIdUseCase.execute(id);
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }
}
