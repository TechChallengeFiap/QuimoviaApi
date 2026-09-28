import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { USER_ROLES } from '@/modules/user/domain/enums/user-role.enum.js';
import { USER_STATUSES } from '@/modules/user/domain/enums/user-status.enum.js';

/**
 * Runtimes que transpilam o TypeScript com esbuild (como o tsx) não emitem a
 * metadata `design:*`. Sem ela, o Swagger só conhece o que está declarado nos
 * decorators e deixa de gerar o /api quando algum @ApiProperty não informa o
 * `type`.
 *
 * Para simular esse cenário, a leitura da metadata `design:*` é desligada antes
 * de o módulo user ser importado, ou seja, antes de seus decorators serem
 * avaliados.
 */
describe('Swagger do módulo user (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const getMetadata = Reflect.getMetadata.bind(Reflect);
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockImplementation((metadataKey, target, propertyKey) =>
        String(metadataKey).startsWith('design:')
          ? undefined
          : getMetadata(metadataKey, target, propertyKey),
      );

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
