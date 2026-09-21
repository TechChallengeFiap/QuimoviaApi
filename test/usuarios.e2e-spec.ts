import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HASH_DE_SENHA } from './../src/application/usuarios/contracts/hash-de-senha.js';
import { USUARIO_REPOSITORY } from './../src/application/usuarios/contracts/usuario.repository.js';
import { UsuariosModule } from './../src/presentation/usuarios/usuarios.module.js';
import { DominioExceptionFilter } from './../src/presentation/shared/filters/dominio-exception.filter.js';
import { HashDeSenhaMock } from './mocks/hash-de-senha.mock.js';
import { UsuarioRepositoryMock } from './mocks/usuario-repository.mock.js';

describe('UsuariosController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsuariosModule],
    })
      .overrideProvider(USUARIO_REPOSITORY)
      .useClass(UsuarioRepositoryMock)
      .overrideProvider(HASH_DE_SENHA)
      .useClass(HashDeSenhaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DominioExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('cria, busca, atualiza e remove um usuário (fluxo completo)', async () => {
    const criacao = await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nome: 'Maria Silva',
        email: 'maria@quimovia.com',
        senha: 'S3nhaForte!',
        perfil: 'OPERADOR_PORTUARIO',
      })
      .expect(201);

    expect(criacao.body).toMatchObject({
      nome: 'Maria Silva',
      email: 'maria@quimovia.com',
      perfil: 'OPERADOR_PORTUARIO',
      status: 'ATIVO',
    });
    expect(criacao.body.senhaHash).toBeUndefined();

    const id = criacao.body.id as string;

    await request(app.getHttpServer()).get(`/usuarios/${id}`).expect(200);

    await request(app.getHttpServer())
      .patch(`/usuarios/${id}`)
      .send({ nome: 'Maria Souza' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.nome).toBe('Maria Souza');
      });

    await request(app.getHttpServer()).delete(`/usuarios/${id}`).expect(204);
    await request(app.getHttpServer()).get(`/usuarios/${id}`).expect(404);
  });

  it('rejeita a criação de um usuário com e-mail duplicado', async () => {
    const dados = {
      nome: 'Maria Silva',
      email: 'duplicado@quimovia.com',
      senha: 'S3nhaForte!',
      perfil: 'OPERADOR_PORTUARIO',
    };

    await request(app.getHttpServer()).post('/usuarios').send(dados).expect(201);
    await request(app.getHttpServer()).post('/usuarios').send(dados).expect(409);
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({ nome: 'Ok', email: 'invalido', senha: '123', perfil: 'INEXISTENTE' })
      .expect(400);
  });

  it('lista usuários paginados', async () => {
    await request(app.getHttpServer()).post('/usuarios').send({
      nome: 'Maria Silva',
      email: 'maria2@quimovia.com',
      senha: 'S3nhaForte!',
      perfil: 'OPERADOR_PORTUARIO',
    });

    const resposta = await request(app.getHttpServer()).get('/usuarios').expect(200);

    expect(resposta.body).toMatchObject({ pagina: 1, itensPorPagina: 20 });
    expect(resposta.body.itens.length).toBeGreaterThanOrEqual(1);
  });
});
