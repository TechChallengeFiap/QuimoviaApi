import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

/**
 * Gera o Swagger da autenticação sem a metadata `design:*`, como acontece com
 * o tsx, usando a mesma configuração do main.ts: o token de acesso é exigido
 * só nas operações protegidas pelo AuthGuard.
 */
describe('Swagger da autenticação (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    disableDesignMetadata();

    const { UserModule } = await import('@/modules/user/user.module.js');
    const { USER_REPOSITORY } =
      await import('@/modules/user/domain/repositories/user.repository.js');
    const { SESSION_REPOSITORY } =
      await import('@/modules/user/domain/repositories/session.repository.js');
    const { PASSWORD_HASHER } =
      await import('@/modules/user/application/contracts/password-hasher.contract.js');
    const { AUTH_CONFIG } =
      await import('@/modules/user/infrastructure/config/auth.config.js');
    const { buildSwaggerConfig } =
      await import('@/shared/infrastructure/config/swagger.config.js');
    const { UserRepositoryMock } =
      await import('../mocks/user-repository.mock.js');
    const { SessionRepositoryMock } =
      await import('../mocks/session-repository.mock.js');
    const { PasswordHasherMock } =
      await import('../mocks/password-hasher.mock.js');
    const { TEST_AUTH_CONFIG } = await import('../mocks/auth-config.mock.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .compile();

    app = moduleFixture.createNestApplication();
    document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  function loginRequestBody() {
    const requestBody = document.paths['/auth/login']?.post?.requestBody;

    return requestBody && 'content' in requestBody
      ? requestBody.content['application/json']
      : undefined;
  }

  it('expõe operationIds descritivos, derivados dos nomes dos métodos', () => {
    expect(document.paths['/auth/login']?.post?.operationId).toBe(
      'AuthController_login',
    );
    expect(document.paths['/auth/logout']?.post?.operationId).toBe(
      'AuthController_logout',
    );
  });

  it('registra o esquema do token de acesso (bearer JWT)', () => {
    expect(document.components?.securitySchemes).toEqual({
      bearer: expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }),
    });
  });

  it('exige o token só no logout, a operação protegida pelo AuthGuard', () => {
    expect(document.security).toBeUndefined();
    expect(document.paths['/auth/logout']?.post?.security).toEqual([
      { bearer: [] },
    ]);
    expect(document.paths['/auth/login']?.post).not.toHaveProperty('security');
    expect(document.paths['/usuarios']?.get).not.toHaveProperty('security');
  });

  it('documenta o corpo do login com o LoginDto e um exemplo válido', async () => {
    const { LoginDto } =
      await import('@/modules/user/presentation/dtos/login.dto.js');
    const body = loginRequestBody();

    expect(body).toMatchObject({
      schema: { $ref: '#/components/schemas/LoginDto' },
      examples: { padrao: { value: { email: 'maria.silva@quimovia.com' } } },
    });
    expect(document.components?.schemas?.LoginDto).toMatchObject({
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password', writeOnly: true },
      },
    });

    const example = body?.examples?.padrao;
    const value = example && 'value' in example ? example.value : undefined;
    const errors = await validate(plainToInstance(LoginDto, value), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toEqual([]);
  });

  it('gera o schema da resposta do login com os tipos declarados', () => {
    expect(document.components?.schemas?.LoginResponseDto).toMatchObject({
      properties: {
        accessToken: { type: 'string' },
        tokenType: { type: 'string', enum: ['Bearer'], example: 'Bearer' },
        expiresAt: { type: 'string', format: 'date-time' },
        user: {
          allOf: [{ $ref: '#/components/schemas/UserResponseDto' }],
        },
      },
    });
  });

  it('documenta as respostas de sucesso e de erro de cada operação', () => {
    const statusesOf = (path: string) =>
      Object.keys(document.paths[path]?.post?.responses ?? {}).sort();

    expect(statusesOf('/auth/login')).toEqual(['200', '400', '401', '403']);
    expect(statusesOf('/auth/logout')).toEqual(['204', '401']);
  });

  it('documenta a resposta 401 com a mensagem do guard', async () => {
    const { MISSING_ACCESS_TOKEN_MESSAGE } =
      await import('@/modules/user/presentation/decorators/api-requires-authentication.decorator.js');
    const response = document.paths['/auth/logout']?.post?.responses?.['401'];
    const example =
      response && 'content' in response
        ? response.content?.['application/json']?.schema
        : undefined;

    expect(example).toMatchObject({
      example: { message: MISSING_ACCESS_TOKEN_MESSAGE, statusCode: 401 },
    });
  });
});
