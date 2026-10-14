import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/create-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/delete-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/find-chemical-shipment-by-id.use-case.js';
import { ListChemicalShipmentsUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/list-chemical-shipments.use-case.js';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/update-chemical-shipment.use-case.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { ChemicalShipmentPageResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-page-response.dto.js';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.js';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.js';
import { ListChemicalShipmentsQueryDto } from '@/modules/chemical-shipment/presentation/dtos/list-chemical-shipment-query.dto.js';
import { UpdateChemicalShipmentDto } from '@/modules/chemical-shipment/presentation/dtos/update-chemical-shipment.dto.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { ApiErrorResponse } from '@/shared/presentation/docs/api-error-response.decorator.js';
import { ApiPaginationQuery } from '@/shared/presentation/docs/api-pagination-query.decorator.js';
import { ApiIdParam } from '@/shared/presentation/docs/api-id-param.decorator.js';

const SHIPMENT_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const SHIPMENT_NOT_FOUND_MESSAGE =
  `Carga química não encontrado(a) para o identificador "${SHIPMENT_ID_EXAMPLE}".`;

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
  @ApiOperation({
    summary: 'Cadastrar nova carga química',
    description:
      'Cria um novo registro de carga química com status inicial ANALYZING.',
  })
  @ApiBody({
    type: CreateChemicalShipmentDTO,
    description: 'Dados necessários para o cadastro da carga química.',
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
  async createChemicalShipment(
    @Body(validationPipeFor(CreateChemicalShipmentDTO))
    chemicalShipment: CreateChemicalShipmentDTO,
  ): Promise<ChemicalShipmentResponseDto> {
    const details =
      await this.createChemicalShipmentUseCase.execute(chemicalShipment);
    return ChemicalShipmentResponseDto.fromDetails(details);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista as cargas químicas, com filtro por status, produto, usuário responsável e documentos',
    description:
      'Retorna uma lista paginada de cargas químicas. Permite filtrar por status, ID do produto, usuário responsável e ID dos documentos.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StatusShipment,
    enumName: 'StatusShipment',
    description: 'Filtra as cargas químicas pelo status atual',
    example: StatusShipment.ANALYZING,
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    description: 'Filtra as cargas químicas pelo identificador do produto',
  })
  @ApiQuery({
    name: 'responsibleUserId',
    required: false,
    type: String,
    description:
      'Filtra as cargas químicas pelo identificador do usuário responsável',
  })
  @ApiQuery({
    name: 'documentsIds',
    required: false,
    type: String,
    description:
      'Filtra as cargas químicas pelo identificador do documento anexado',
  })
  @ApiPaginationQuery('registros')
  @ApiOkResponse({
    description: 'Lista de cargas químicas retornada com sucesso.',
    type: ChemicalShipmentPageResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Filtros ou parâmetros de paginação inválidos.',
    [
      'page must not be less than 1',
      'pageSize must not be greater than 100',
    ],
  )
  async listChemicalShipments(
    @Query(validationPipeFor(ListChemicalShipmentsQueryDto))
    query: ListChemicalShipmentsQueryDto,
  ): Promise<ChemicalShipmentPageResponseDto> {
    const page = await this.listChemicalShipmentsUseCase.execute(query);
    return ChemicalShipmentPageResponseDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma carga química pelo ID',
    description: 'Retorna uma carga química pelo ID.',
  })
  @ApiIdParam('ID da carga química', SHIPMENT_ID_EXAMPLE)
  @ApiOkResponse({
    description: 'Carga química encontrada com sucesso.',
    type: ChemicalShipmentResponseDto,
  })
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Carga química não encontrada.',
    SHIPMENT_NOT_FOUND_MESSAGE,
  )
  async findChemicalShipmentById(
    @Param('id') id: string,
  ): Promise<ChemicalShipmentResponseDto> {
    const details = await this.findChemicalShipmentByIdUseCase.execute(id);
    return ChemicalShipmentResponseDto.fromDetails(details);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma carga química',
    description:
      'Atualiza apenas os campos enviados. Uma carga aprovada ou reprovada não pode mais ser alterada.',
  })
  @ApiIdParam('ID da carga química', SHIPMENT_ID_EXAMPLE)
  @ApiBody({
    type: UpdateChemicalShipmentDto,
    description: 'Campos a serem atualizados; todos são opcionais.',
    examples: {
      alterarSituacao: {
        summary: 'Altera a situação',
        description: 'Somente a situação da carga química é atualizada.',
        value: { status: StatusShipment.APPROVED },
      },
    },
  })
  @ApiOkResponse({
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
    HttpStatus.NOT_FOUND,
    'Carga química ou usuário responsável não encontrado.',
    SHIPMENT_NOT_FOUND_MESSAGE,
  )
  @ApiErrorResponse(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'A carga química já foi aprovada ou reprovada.',
    'Não é possível alterar uma carga química aprovada',
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
  @ApiOperation({
    summary: 'Remove uma carga química',
    description: 'Remove uma carga química pelo ID.',
  })
  @ApiIdParam('ID da carga química', SHIPMENT_ID_EXAMPLE)
  @ApiOkResponse({ description: 'Carga química removida com sucesso.' })
  @ApiErrorResponse(
    HttpStatus.NOT_FOUND,
    'Carga química não encontrada.',
    SHIPMENT_NOT_FOUND_MESSAGE,
  )
  async deleteChemicalShipment(@Param('id') id: string): Promise<void> {
    await this.deleteChemicalShipmentUseCase.execute(id);
  }
}
