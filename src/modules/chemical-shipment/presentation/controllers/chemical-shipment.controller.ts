import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment/create-chemical-shipment.dto.ts';

@Controller('chemical-shipment')
@ApiTags('Cargas Químicas')
export class ChemicalShipmentController {
  constructor(
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
    schema: {
      example: {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        productId: 'prod-001',
        status: 'ANALYZING',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
        createdAt: '2026-09-22T19:00:00.000Z',
        updatedAt: '2026-09-22T19:00:00.000Z',
        deletedAt: null,
      },
    },
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
  ) {
    return this.createChemicalShipmentUseCase.execute(chemicalShipment);
  }
}
