import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment/create-chemical-shipment.dto.ts';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment/chemical-shipment-response.dto.ts';

@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
export class ChemicalShipmentController {
  constructor(
    @Inject(CreateChemicalShipmentUseCase)
    private readonly createChemicalShipmentUseCase: CreateChemicalShipmentUseCase,
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
    @Body() chemicalShipment: CreateChemicalShipmentDTO,
  ): Promise<ChemicalShipmentResponseDto> {
    const shipment =
      await this.createChemicalShipmentUseCase.execute(chemicalShipment);
    return ChemicalShipmentResponseDto.fromEntity(shipment);
  }

  // @Get()
  // @ApiOperation({
  //   summary: 'Lista todas as cargas químicas',
  // })
  // @ApiResponse({status: HttpStatus.OK, type: ChemicalShipmentResponseDto})
  // @ApiResponse({status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Erro interno do servidor ao processar a listagem das cargas químicas.'})
}
