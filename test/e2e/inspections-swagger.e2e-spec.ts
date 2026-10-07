import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { INSPECTION_ITEM_RESULTS } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { INSPECTION_REQUIREMENTS } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { INSPECTION_SCOPES } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { INSPECTION_STATUSES } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

/**
 * Gera o Swagger do módulo inspection sem a metadata `design:*`, como acontece
 * com o tsx: tudo o que a documentação precisa (tipos das propriedades, corpo,
 * query e parâmetros de rota) tem de estar declarado nos decorators.
 */
describe('Swagger do módulo inspection (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    disableDesignMetadata();

    const { InspectionModule } =
      await import('@/modules/inspection/inspection.module.js');
    const { INSPECTION_REPOSITORY } =
      await import('@/modules/inspection/domain/repositories/inspection.repository.js');
    const { InspectionRepositoryMock } =
      await import('../mocks/inspection-repository.mock.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [InspectionModule],
    })
      .overrideProvider(INSPECTION_REPOSITORY)
      .useClass(InspectionRepositoryMock)
      .compile();

    app = moduleFixture.createNestApplication();
    document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  function jsonRequestBodyOf(path: string, method: 'post' | 'patch') {
    const requestBody = document.paths[path]?.[method]?.requestBody;

    return requestBody && 'content' in requestBody
      ? requestBody.content['application/json']
      : undefined;
  }

  function requestExamplesOf(path: string, method: 'post' | 'patch') {
    const examples = jsonRequestBodyOf(path, method)?.examples ?? {};

    return Object.entries(examples).map(([name, example]) => ({
      name,
      value: ('value' in example ? example.value : undefined) as object,
    }));
  }

  it('expõe operationIds descritivos, derivados dos nomes dos métodos', () => {
    const { paths } = document;

    expect(paths['/inspecoes']?.post?.operationId).toBe(
      'InspectionsController_createInspection',
    );
    expect(paths['/inspecoes']?.get?.operationId).toBe(
      'InspectionsController_listInspections',
    );
    expect(paths['/inspecoes/{id}']?.get?.operationId).toBe(
      'InspectionsController_findInspectionById',
    );
    expect(paths['/inspecoes/{id}']?.patch?.operationId).toBe(
      'InspectionsController_updateInspection',
    );
    expect(paths['/inspecoes/{id}']?.delete?.operationId).toBe(
      'InspectionsController_deleteInspection',
    );
  });

  it('documenta os enums do módulo como schemas reutilizáveis', () => {
    expect(document.components?.schemas).toMatchObject({
      InspectionScope: { type: 'string', enum: INSPECTION_SCOPES },
      InspectionStatus: { type: 'string', enum: INSPECTION_STATUSES },
      InspectionRequirement: { type: 'string', enum: INSPECTION_REQUIREMENTS },
      InspectionItemResult: { type: 'string', enum: INSPECTION_ITEM_RESULTS },
    });
  });

  it('gera o schema de InspectionResponseDto com os tipos declarados nos decorators', () => {
    expect(document.components?.schemas?.InspectionResponseDto).toMatchObject({
      properties: {
        id: { type: 'string' },
        cargoId: { type: 'string' },
        compositionVersion: { type: 'number' },
        scope: { allOf: [{ $ref: '#/components/schemas/InspectionScope' }] },
        cargoItemId: { type: 'string', nullable: true },
        inspectorId: { type: 'string' },
        status: { allOf: [{ $ref: '#/components/schemas/InspectionStatus' }] },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/InspectionItemResponseDto' },
        },
        startedAt: { type: 'string', format: 'date-time', nullable: true },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    });
    expect(
      document.components?.schemas?.InspectionItemResponseDto,
    ).toMatchObject({
      properties: {
        requirement: {
          allOf: [{ $ref: '#/components/schemas/InspectionRequirement' }],
        },
        result: {
          nullable: true,
          allOf: [{ $ref: '#/components/schemas/InspectionItemResult' }],
        },
        observation: { type: 'string', nullable: true },
      },
    });
  });

  it('documenta o corpo do cadastro com o CreateInspectionDto e exemplos de payload', () => {
    expect(jsonRequestBodyOf('/inspecoes', 'post')).toMatchObject({
      schema: { $ref: '#/components/schemas/CreateInspectionDto' },
      examples: {
        cargaInteira: { value: { scope: 'CARGO' } },
        itemDaCarga: { value: { scope: 'CARGO_ITEM' } },
      },
    });
    expect(document.components?.schemas?.CreateInspectionDto).toMatchObject({
      required: [
        'cargoId',
        'compositionVersion',
        'scope',
        'inspectorId',
        'requirements',
      ],
      properties: {
        cargoId: { type: 'string', format: 'uuid' },
        compositionVersion: { type: 'number', minimum: 1 },
        cargoItemId: { type: 'string', format: 'uuid' },
        requirements: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { $ref: '#/components/schemas/InspectionRequirement' },
        },
      },
    });
  });

  it('documenta o corpo da atualização com os resultados aninhados', () => {
    expect(jsonRequestBodyOf('/inspecoes/{id}', 'patch')).toMatchObject({
      schema: { $ref: '#/components/schemas/UpdateInspectionDto' },
      examples: {
        iniciar: { value: { status: 'IN_PROGRESS' } },
        concluir: { value: { status: 'COMPLETED' } },
      },
    });
    expect(document.components?.schemas?.UpdateInspectionDto).toMatchObject({
      properties: {
        results: {
          type: 'array',
          items: { $ref: '#/components/schemas/InspectionItemResultDto' },
        },
      },
    });
    expect(
      document.components?.schemas?.UpdateInspectionDto,
    ).not.toHaveProperty('required');
  });

  it('usa exemplos de payload que passam na validação dos DTOs', async () => {
    const { CreateInspectionDto } =
      await import('@/modules/inspection/presentation/dtos/create-inspection.dto.js');
    const { UpdateInspectionDto } =
      await import('@/modules/inspection/presentation/dtos/update-inspection.dto.js');
    const payloads: {
      name: string;
      dto: ClassConstructor<object>;
      value: object;
    }[] = [
      ...requestExamplesOf('/inspecoes', 'post').map((example) => ({
        ...example,
        dto: CreateInspectionDto,
      })),
      ...requestExamplesOf('/inspecoes/{id}', 'patch').map((example) => ({
        ...example,
        dto: UpdateInspectionDto,
      })),
    ];

    expect(payloads).toHaveLength(6);

    for (const { name, dto, value } of payloads) {
      const errors = await validate(plainToInstance(dto, value), {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect({ name, errors }).toEqual({ name, errors: [] });
    }
  });

  it('documenta os filtros e a paginação da listagem', () => {
    const parameters = document.paths['/inspecoes']?.get?.parameters;

    expect(parameters).toHaveLength(5);
    expect(parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cargoId',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ type: 'string', format: 'uuid' }),
        }),
        expect.objectContaining({
          name: 'inspectorId',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ type: 'string', format: 'uuid' }),
        }),
        expect.objectContaining({
          name: 'status',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/schemas/InspectionStatus' },
        }),
        expect.objectContaining({
          name: 'page',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ type: 'number', minimum: 1 }),
        }),
        expect.objectContaining({
          name: 'pageSize',
          in: 'query',
          required: false,
          schema: expect.objectContaining({ type: 'number', maximum: 100 }),
        }),
      ]),
    );
  });

  it('documenta o id como parâmetro de rota dos endpoints de uma inspeção', () => {
    const inspectionById = document.paths['/inspecoes/{id}'];

    for (const operation of [
      inspectionById?.get,
      inspectionById?.patch,
      inspectionById?.delete,
    ]) {
      expect(operation?.parameters).toEqual([
        expect.objectContaining({
          name: 'id',
          in: 'path',
          required: true,
          schema: expect.objectContaining({ type: 'string' }),
        }),
      ]);
    }
  });

  it('documenta as respostas de sucesso e de erro de cada endpoint', () => {
    const statusesOf = (
      path: string,
      method: 'get' | 'post' | 'patch' | 'delete',
    ) => Object.keys(document.paths[path]?.[method]?.responses ?? {}).sort();

    expect(statusesOf('/inspecoes', 'post')).toEqual([
      '201',
      '400',
      '401',
      '422',
    ]);
    expect(statusesOf('/inspecoes', 'get')).toEqual(['200', '400', '401']);
    expect(statusesOf('/inspecoes/{id}', 'get')).toEqual(['200', '401', '404']);
    expect(statusesOf('/inspecoes/{id}', 'patch')).toEqual([
      '200',
      '400',
      '401',
      '404',
      '422',
    ]);
    expect(statusesOf('/inspecoes/{id}', 'delete')).toEqual([
      '204',
      '401',
      '404',
      '422',
    ]);
  });
});
