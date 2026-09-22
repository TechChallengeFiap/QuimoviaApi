import { BuscarUsuarioPorIdUseCase } from '../../../src/modules/identidade-acesso/application/use-cases/buscar-usuario-por-id.use-case.js';
import { ListarUsuariosUseCase } from '../../../src/modules/identidade-acesso/application/use-cases/listar-usuarios.use-case.js';
import { RemoverUsuarioUseCase } from '../../../src/modules/identidade-acesso/application/use-cases/remover-usuario.use-case.js';
import { Usuario } from '../../../src/modules/identidade-acesso/domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../../src/modules/identidade-acesso/domain/enums/perfil-usuario.enum.js';
import { RecursoNaoEncontradoError } from '../../../src/shared/domain/errors/dominio.error.js';
import { UsuarioRepositoryMock } from '../../mocks/usuario-repository.mock.js';

describe('BuscarUsuarioPorIdUseCase', () => {
  it('lança erro quando o usuário não existe', async () => {
    const useCase = new BuscarUsuarioPorIdUseCase(new UsuarioRepositoryMock());

    await expect(useCase.executar('id-inexistente')).rejects.toThrow(
      RecursoNaoEncontradoError,
    );
  });

  it('retorna o usuário quando ele existe', async () => {
    const usuarios = new UsuarioRepositoryMock();
    const usuario = await usuarios.criar(
      Usuario.criar({
        nome: 'Maria Silva',
        email: 'maria@quimovia.com',
        senhaHash: 'hash',
        perfil: PerfilUsuario.OPERADOR_PORTUARIO,
      }),
    );

    const useCase = new BuscarUsuarioPorIdUseCase(usuarios);

    await expect(useCase.executar(usuario.id)).resolves.toBe(usuario);
  });
});

describe('ListarUsuariosUseCase', () => {
  it('aplica os valores padrão de paginação', async () => {
    const usuarios = new UsuarioRepositoryMock();
    const useCase = new ListarUsuariosUseCase(usuarios);

    const resultado = await useCase.executar();

    expect(resultado).toEqual({ itens: [], total: 0, pagina: 1, itensPorPagina: 20 });
  });

  it('filtra por perfil', async () => {
    const usuarios = new UsuarioRepositoryMock();
    await usuarios.criar(
      Usuario.criar({
        nome: 'Operador',
        email: 'operador@quimovia.com',
        senhaHash: 'hash',
        perfil: PerfilUsuario.OPERADOR_PORTUARIO,
      }),
    );
    await usuarios.criar(
      Usuario.criar({
        nome: 'Gestor',
        email: 'gestor@quimovia.com',
        senhaHash: 'hash',
        perfil: PerfilUsuario.GESTOR_OPERACIONAL,
      }),
    );

    const useCase = new ListarUsuariosUseCase(usuarios);
    const resultado = await useCase.executar({ perfil: PerfilUsuario.GESTOR_OPERACIONAL });

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0]?.perfil).toBe(PerfilUsuario.GESTOR_OPERACIONAL);
  });
});

describe('RemoverUsuarioUseCase', () => {
  it('lança erro quando o usuário não existe', async () => {
    const useCase = new RemoverUsuarioUseCase(new UsuarioRepositoryMock());

    await expect(useCase.executar('id-inexistente')).rejects.toThrow(
      RecursoNaoEncontradoError,
    );
  });

  it('remove um usuário existente', async () => {
    const usuarios = new UsuarioRepositoryMock();
    const usuario = await usuarios.criar(
      Usuario.criar({
        nome: 'Maria Silva',
        email: 'maria@quimovia.com',
        senhaHash: 'hash',
        perfil: PerfilUsuario.OPERADOR_PORTUARIO,
      }),
    );

    const useCase = new RemoverUsuarioUseCase(usuarios);
    await useCase.executar(usuario.id);

    await expect(usuarios.buscarPorId(usuario.id)).resolves.toBeNull();
  });
});
