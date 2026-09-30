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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { DeleteInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/delete-inspection.use-case.js';
import { FindInspectionByIdUseCase } from '@/modules/inspection/application/use-cases/inspections/find-inspection-by-id.use-case.js';
import { ListInspectionsUseCase } from '@/modules/inspection/application/use-cases/inspections/list-inspections.use-case.js';
import { UpdateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/update-inspection.use-case.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { CreateInspectionDto } from '@/modules/inspection/presentation/dtos/create-inspection.dto.js';
import { InspectionPageResponseDto } from '@/modules/inspection/presentation/dtos/inspection-page-response.dto.js';
import { InspectionResponseDto } from '@/modules/inspection/presentation/dtos/inspection-response.dto.js';
import { ListInspectionsQueryDto } from '@/modules/inspection/presentation/dtos/list-inspections-query.dto.js';
import { UpdateInspectionDto } from '@/modules/inspection/presentation/dtos/update-inspection.dto.js';

const INSPECTION_ID_EXAMPLE = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const CARGO_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const CARGO_ITEM_ID_EXAMPLE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const INSPECTOR_ID_EXAMPLE = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

const INSPECTION_NOT_FOUND_EXAMPLE = {
  message: `Inspeção não encontrado(a) para o identificador "${INSPECTION_ID_EXAMPLE}".`,
  error: 'Not Found',
  statusCode: HttpStatus.NOT_FOUND,
};

@ApiTags('Inspeções')
@Controller('inspecoes')
@UseFilters(DomainExceptionFilter)
export class InspectionsController {
  constructor(
    @Inject(CreateInspectionUseCase)
    private readonly createInspectionUseCase: CreateInspectionUseCase,
    @Inject(ListInspectionsUseCase)
    private readonly listInspectionsUseCase: ListInspectionsUseCase,
    @Inject(FindInspectionByIdUseCase)
    private readonly findInspectionByIdUseCase: FindInspectionByIdUseCase,
    @Inject(UpdateInspectionUseCase)
    private readonly updateInspectionUseCase: UpdateInspectionUseCase,
    @Inject(DeleteInspectionUseCase)
    private readonly deleteInspectionUseCase: DeleteInspectionUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra uma nova inspeção',
    description:
      'Registra uma inspeção pendente para a carga inteira ou para um item da carga, com o Fiscal responsável e as verificações de segurança previstas.',
  })
  @ApiBody({
    type: CreateInspectionDto,
    description: 'Dados necessários para o cadastro da inspeção.',
    examples: {
      cargaInteira: {
        summary: 'Inspeção da carga inteira',
        description: 'Avalia a carga como um todo, sem item específico.',
        value: {
          cargoId: CARGO_ID_EXAMPLE,
          compositionVersion: 1,
          scope: InspectionScope.CARGO,
          inspectorId: INSPECTOR_ID_EXAMPLE,
          requirements: [
            InspectionRequirement.PACKAGING_INTEGRITY,
            InspectionRequirement.NO_LEAKAGE,
            InspectionRequirement.CORRECT_LABELING,
          ],
        },
      },
      itemDaCarga: {
        summary: 'Inspeção de um item da carga',
        description:
          'Avalia apenas o item informado, que deve pertencer à composição avaliada.',
        value: {
          cargoId: CARGO_ID_EXAMPLE,
          compositionVersion: 2,
          scope: InspectionScope.CARGO_ITEM,
          cargoItemId: CARGO_ITEM_ID_EXAMPLE,
          inspectorId: INSPECTOR_ID_EXAMPLE,
          requirements: [
            InspectionRequirement.EXPIRATION_DATE,
            InspectionRequirement.SAFETY_EQUIPMENT,
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Inspeção cadastrada com sucesso.',
    type: InspectionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'cargoId must be a UUID',
          'compositionVersion must not be less than 1',
          'requirements should not be empty',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Os dados violam uma regra de negócio da inspeção.',
    schema: {
      example: {
        message:
          'A inspeção de um item da carga exige o identificador do item.',
        error: 'Unprocessable Entity',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  async createInspection(
    @Body(validationPipeFor(CreateInspectionDto))
    createInspectionDto: CreateInspectionDto,
  ): Promise<InspectionResponseDto> {
    const inspection =
      await this.createInspectionUseCase.execute(createInspectionDto);
    return InspectionResponseDto.fromEntity(inspection);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista inspeções, com filtro por carga, Fiscal e status',
    description:
      'Retorna uma lista paginada de inspeções, ordenada do cadastro mais recente para o mais antigo.',
  })
  @ApiQuery({
    name: 'cargoId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtra as inspeções de uma carga',
    example: CARGO_ID_EXAMPLE,
  })
  @ApiQuery({
    name: 'inspectorId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtra as inspeções de um Fiscal',
    example: INSPECTOR_ID_EXAMPLE,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    description: 'Filtra as inspeções pela situação atual',
    example: InspectionStatus.PENDING,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    default: 1,
    description: 'Número da página desejada',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Quantidade de inspeções por página (máximo 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Lista de inspeções retornada com sucesso.',
    type: InspectionPageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
    schema: {
      example: {
        message: [
          'cargoId must be a UUID',
          'pageSize must not be greater than 100',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  async listInspections(
    @Query(validationPipeFor(ListInspectionsQueryDto))
    query: ListInspectionsQueryDto,
  ): Promise<InspectionPageResponseDto> {
    const page = await this.listInspectionsUseCase.execute(query);
    return InspectionPageResponseDto.fromPage(page);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma inspeção pelo id',
    description:
      'Retorna os dados de uma inspeção, com as verificações previstas e seus resultados.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador da inspeção',
    example: INSPECTION_ID_EXAMPLE,
  })
  @ApiOkResponse({
    description: 'Inspeção encontrada com sucesso.',
    type: InspectionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Inspeção não encontrada.',
    schema: { example: INSPECTION_NOT_FOUND_EXAMPLE },
  })
  async findInspectionById(
    @Param('id') id: string,
  ): Promise<InspectionResponseDto> {
    const inspection = await this.findInspectionByIdUseCase.execute(id);
    return InspectionResponseDto.fromEntity(inspection);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma inspeção',
    description:
      'Reatribui o Fiscal, registra os resultados das verificações e avança o status: IN_PROGRESS inicia a inspeção e COMPLETED a conclui, o que exige resultado em todas as verificações. Uma inspeção concluída não pode mais ser alterada.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador da inspeção',
    example: INSPECTION_ID_EXAMPLE,
  })
  @ApiBody({
    type: UpdateInspectionDto,
    description: 'Alterações a aplicar; todos os campos são opcionais.',
    examples: {
      iniciar: {
        summary: 'Inicia a inspeção',
        description: 'A inspeção passa de PENDING para IN_PROGRESS.',
        value: { status: InspectionStatus.IN_PROGRESS },
      },
      registrarResultados: {
        summary: 'Registra resultados',
        description:
          'Uma não conformidade exige a descrição da irregularidade na observação.',
        value: {
          results: [
            {
              requirement: InspectionRequirement.PACKAGING_INTEGRITY,
              result: InspectionItemResult.COMPLIANT,
            },
            {
              requirement: InspectionRequirement.NO_LEAKAGE,
              result: InspectionItemResult.NON_COMPLIANT,
              observation: 'Vazamento na válvula do tambor 3.',
            },
          ],
        },
      },
      concluir: {
        summary: 'Conclui a inspeção',
        description: 'Exige o resultado de todas as verificações previstas.',
        value: { status: InspectionStatus.COMPLETED },
      },
      reatribuirFiscal: {
        summary: 'Reatribui o Fiscal',
        description: 'Permitido enquanto a inspeção não estiver concluída.',
        value: { inspectorId: INSPECTOR_ID_EXAMPLE },
      },
    },
  })
  @ApiOkResponse({
    description: 'Inspeção atualizada com sucesso.',
    type: InspectionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos no corpo da requisição.',
    schema: {
      example: {
        message: [
          'status must be one of the following values: PENDING, IN_PROGRESS, COMPLETED',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inspeção não encontrada.',
    schema: { example: INSPECTION_NOT_FOUND_EXAMPLE },
  })
  @ApiUnprocessableEntityResponse({
    description:
      'A alteração viola uma regra da inspeção, como concluir com verificações pendentes ou alterar uma inspeção concluída.',
    schema: {
      example: {
        message:
          'A inspeção só pode ser concluída com o resultado de todas as verificações. Pendentes: NO_LEAKAGE.',
        error: 'Unprocessable Entity',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  async updateInspection(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateInspectionDto))
    updateInspectionDto: UpdateInspectionDto,
  ): Promise<InspectionResponseDto> {
    const inspection = await this.updateInspectionUseCase.execute(
      id,
      updateInspectionDto,
    );
    return InspectionResponseDto.fromEntity(inspection);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma inspeção pendente',
    description:
      'Remove uma inspeção que ainda não foi iniciada. Inspeções em andamento ou concluídas fazem parte do histórico da carga e não podem ser removidas.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Identificador da inspeção',
    example: INSPECTION_ID_EXAMPLE,
  })
  @ApiNoContentResponse({ description: 'Inspeção removida com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Inspeção não encontrada.',
    schema: { example: INSPECTION_NOT_FOUND_EXAMPLE },
  })
  @ApiUnprocessableEntityResponse({
    description: 'A inspeção já foi iniciada e não pode ser removida.',
    schema: {
      example: {
        message:
          'Somente inspeções pendentes podem ser removidas; as demais fazem parte do histórico da carga.',
        error: 'Unprocessable Entity',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  async deleteInspection(@Param('id') id: string): Promise<void> {
    await this.deleteInspectionUseCase.execute(id);
  }
}
