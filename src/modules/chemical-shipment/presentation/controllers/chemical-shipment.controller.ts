import {
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
  Query,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/create-chemical-shipment.use-case.js';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.js';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.js';
import { ChemicalShipmentPageResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-page-response.dto.js';
import { ListChemicalShipmentsQueryDto } from '@/modules/chemical-shipment/presentation/dtos/list-chemical-shipment-query.dto.js';
import { ListChemicalShipmentsUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/list-chemical-shipments.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/find-chemical-shipment-by-id.use-case.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { UpdateChemicalShipmentDto } from '@/modules/chemical-shipment/presentation/dtos/update-chemical-shipment.dto.js';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/delete-chemical-shipment.use-case.js';
import { ApiErrorResponse } from '@/shared/presentation/docs/api-error-response.decorator.js';
import { ApiPaginationQuery } from '@/shared/presentation/docs/api-pagination-query.decorator.js';
import { ApiIdParam } from '@/shared/presentation/docs/api-id-param.decorator.js';
@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
@UseFilters(DomainExceptionFilter)
export class ChemicalShipmentController {
  constructor(
    @Inject(CreateChemicalShipmentUseCase)
    private readonly createChemicalShipmentUseCase: CreateChemicalShipmentUseCase,
    @Inject(ListChemicalShipmentsUseCase)
    private readonly listChemicalShipmentsUseCase: ListChemicalShipmentsUseCase,
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
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Dados inválidos fornecidos no corpo da requisição.',
    [
      'O productId não pode estar vazio',
      'O productId deve ser uma string',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Usuário responsável não encontrado.',
    'Usuário não encontrado(a) para o identificador "user-001".',
  )
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
    const details =
      await this.createChemicalShipmentUseCase.execute(chemicalShipment);
    return ChemicalShipmentResponseDto.fromDetails(details);
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
  @ApiPaginationQuery('registros')
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
  @ApiIdParam('ID da carga química', '1234567890a1b2c3d4e5f6')
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
    const details = await this.findChemicalShipmentByIdUseCase.execute(id);
    return ChemicalShipmentResponseDto.fromDetails(details);
  }

  @Patch(':id')
  @ApiIdParam('ID da carga química', '1234567890a1b2c3d4e5f6')
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
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Dados inválidos fornecidos no corpo da requisição.',
    [
      'O productId não pode estar vazio',
      'O productId deve ser uma string',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.FORBIDDEN,
    'Você não tem permissão para realizar esta ação.',
    [
      'Você não tem permissão para realizar esta ação.',
    ],
  )
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Carga química não encontrada.',
    [
      'Carga química não encontrada.',
    ],
  )
  async updateChemicalShipment(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateChemicalShipmentDto))
    updateChemicalShipmentDto: UpdateChemicalShipmentDto,
  ): Promise<ChemicalShipmentResponseDto> {
    const details = await this.updateChemicalShipmentUseCase.execute(
      id,
      updateChemicalShipmentDto,
    );

    return ChemicalShipmentResponseDto.fromDetails(details);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiIdParam('ID da carga química', '1234567890a1b2c3d4e5f6')
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
    await this.deleteChemicalShipmentUseCase.execute(id);
  }
}
