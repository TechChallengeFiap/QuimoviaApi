import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { USER_ROLES } from '@/modules/user/domain/enums/user-role.enum.js';
import { USER_STATUSES } from '@/modules/user/domain/enums/user-status.enum.js';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

/**
 * Runtimes que transpilam o TypeScript com esbuild (como o tsx) não emitem a
 * metadata `design:*`. Sem ela, o Swagger só conhece o que está declarado nos
 * decorators: deixa de gerar o /api quando algum @ApiProperty não informa o
 * `type` e não documenta o corpo, a query ou os parâmetros de rota que não
 * forem declarados com @ApiBody, @ApiQuery e @ApiParam.
 *
 * Para simular esse cenário, a leitura da metadata `design:*` é desligada antes
 * de o módulo user ser importado, ou seja, antes de seus decorators serem
 * avaliados.
 */
describe('Swagger do módulo user (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    disableDesignMetadata();

    const { UserModule } = await import('@/modules/user/user.module.js');
    const { USER_REPOSITORY } =
      await import('@/modules/user/domain/repositories/user.repository.js');
    const { PASSWORD_HASHER } =
      await import('@/modules/user/application/contracts/password-hasher.contract.js');
    const { UserRepositoryMock } =
      await import('../mocks/user-repository.mock.js');
    const { PasswordHasherMock } =
      await import('../mocks/password-hasher.mock.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
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

  it('documenta o corpo do cadastro com o CreateUserDto e exemplos de payload', () => {
    expect(jsonRequestBodyOf('/usuarios', 'post')).toMatchObject({
      schema: { $ref: '#/components/schemas/CreateUserDto' },
      examples: {
        padrao: { value: { name: 'Maria Silva', role: 'PORT_OPERATOR' } },
        comStatus: { value: { status: 'INACTIVE' } },
      },
    });
    expect(document.components?.schemas?.CreateUserDto).toMatchObject({
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: { type: 'string', minLength: 3 },
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          writeOnly: true,
        },
        role: { allOf: [{ $ref: '#/components/schemas/UserRole' }] },
        status: { allOf: [{ $ref: '#/components/schemas/UserStatus' }] },
      },
    });
  });

  it('documenta o corpo da atualização com o UpdateUserDto e exemplos de payload', () => {
    expect(jsonRequestBodyOf('/usuarios/{id}', 'patch')).toMatchObject({
      schema: { $ref: '#/components/schemas/UpdateUserDto' },
      examples: {
        alterarNome: { value: { name: 'Maria Souza' } },
        alterarPerfil: { value: { role: 'OPERATIONS_MANAGER' } },
        bloquear: { value: { status: 'BLOCKED' } },
        desbloquear: { value: { status: 'ACTIVE' } },
      },
    });
    expect(document.components?.schemas?.UpdateUserDto).not.toHaveProperty(
      'required',
    );
  });

  it('usa exemplos de payload que passam na validação dos DTOs', async () => {
    const { CreateUserDto } =
      await import('@/modules/user/presentation/dtos/create-user.dto.js');
    const { UpdateUserDto } =
      await import('@/modules/user/presentation/dtos/update-user.dto.js');
    const payloads: {
      name: string;
      dto: ClassConstructor<object>;
      value: object;
    }[] = [
      ...requestExamplesOf('/usuarios', 'post').map((example) => ({
        ...example,
        dto: CreateUserDto,
      })),
      ...requestExamplesOf('/usuarios/{id}', 'patch').map((example) => ({
        ...example,
        dto: UpdateUserDto,
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
    const parameters = document.paths['/usuarios']?.get?.parameters;

    expect(parameters).toHaveLength(4);
    expect(parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'role',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/schemas/UserRole' },
        }),
        expect.objectContaining({
          name: 'status',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/schemas/UserStatus' },
        }),
        expect.objectContaining({
          name: 'page',
          in: 'query',
          required: false,
          schema: expect.objectContaining({
            type: 'number',
            minimum: 1,
            default: 1,
          }),
        }),
        expect.objectContaining({
          name: 'pageSize',
          in: 'query',
          required: false,
          schema: expect.objectContaining({
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
          }),
        }),
      ]),
    );
  });

  it('documenta o id como parâmetro de rota dos endpoints de um usuário', () => {
    const userById = document.paths['/usuarios/{id}'];

    for (const operation of [
      userById?.get,
      userById?.patch,
      userById?.delete,
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

    expect(statusesOf('/usuarios', 'post')).toEqual([
      '201',
      '400',
      '409',
      '422',
    ]);
    expect(statusesOf('/usuarios', 'get')).toEqual(['200', '400']);
    expect(statusesOf('/usuarios/{id}', 'get')).toEqual(['200', '404']);
    expect(statusesOf('/usuarios/{id}', 'patch')).toEqual([
      '200',
      '400',
      '404',
      '409',
      '422',
    ]);
    expect(statusesOf('/usuarios/{id}', 'delete')).toEqual(['204', '404']);
  });

  it('expõe operationIds descritivos, derivados dos nomes dos métodos', () => {
    const { paths } = document;

    expect(paths['/usuarios']?.post?.operationId).toBe(
      'UsersController_createUser',
    );
    expect(paths['/usuarios']?.get?.operationId).toBe(
      'UsersController_listUsers',
    );
    expect(paths['/usuarios/{id}']?.get?.operationId).toBe(
      'UsersController_findUserById',
    );
    expect(paths['/usuarios/{id}']?.patch?.operationId).toBe(
      'UsersController_updateUser',
    );
    expect(paths['/usuarios/{id}']?.delete?.operationId).toBe(
      'UsersController_deleteUser',
    );
  });

  it('documenta os enums de perfil e status como schemas reutilizáveis', () => {
    expect(document.components?.schemas).toMatchObject({
      UserRole: { type: 'string', enum: USER_ROLES },
      UserStatus: { type: 'string', enum: USER_STATUSES },
    });
  });

  it('gera o schema de UserResponseDto com os tipos declarados nos decorators', () => {
    expect(document.components?.schemas?.UserResponseDto).toMatchObject({
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { allOf: [{ $ref: '#/components/schemas/UserRole' }] },
        status: { allOf: [{ $ref: '#/components/schemas/UserStatus' }] },
        lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    });
  });

  it('gera o schema da listagem paginada de usuários', () => {
    expect(document.components?.schemas?.UserPageResponseDto).toMatchObject({
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
    });
  });
});
