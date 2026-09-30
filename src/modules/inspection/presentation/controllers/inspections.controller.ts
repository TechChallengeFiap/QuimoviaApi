import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { validationPipeFor } from '@/shared/presentation/pipes/validation.pipe.js';
import { CreateInspectionDto } from '@/modules/inspection/presentation/dtos/create-inspection.dto.js';
import { InspectionResponseDto } from '@/modules/inspection/presentation/dtos/inspection-response.dto.js';

const CARGO_ID_EXAMPLE = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const CARGO_ITEM_ID_EXAMPLE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const INSPECTOR_ID_EXAMPLE = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

@ApiTags('Inspeções')
@Controller('inspecoes')
@UseFilters(DomainExceptionFilter)
export class InspectionsController {
  constructor(
    @Inject(CreateInspectionUseCase)
    private readonly createInspectionUseCase: CreateInspectionUseCase,
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
}
