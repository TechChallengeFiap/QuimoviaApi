import { AtualizarUsuarioUseCase } from '../../src/application/usuarios/use-cases/atualizar-usuario.use-case.js';
import { Usuario } from '../../src/domain/usuarios/entities/usuario.entity.js';
import { PerfilUsuario } from '../../src/domain/usuarios/value-objects/perfil-usuario.js';
import { StatusUsuario } from '../../src/domain/usuarios/value-objects/status-usuario.js';
import {
  ConflitoError,
  RecursoNaoEncontradoError,
} from '../../src/shared/errors/dominio.error.js';
import { HashDeSenhaMock } from '../mocks/hash-de-senha.mock.js';
import { UsuarioRepositoryMock } from '../mocks/usuario-repository.mock.js';

describe('AtualizarUsuarioUseCase', () => {
  let usuarios: UsuarioRepositoryMock;
  let useCase: AtualizarUsuarioUseCase;

  beforeEach(() => {
    usuarios = new UsuarioRepositoryMock();
    useCase = new AtualizarUsuarioUseCase(usuarios, new HashDeSenhaMock());
  });

  async function cadastrarUsuario(email = 'maria@quimovia.com'): Promise<Usuario> {
    const usuario = Usuario.criar({
      nome: 'Maria Silva',
      email,
      senhaHash: 'hash:antiga',
      perfil: PerfilUsuario.OPERADOR_PORTUARIO,
    });

    return usuarios.criar(usuario);
  }

  it('lança erro quando o usuário não existe', async () => {
    await expect(useCase.executar('id-inexistente', { nome: 'Novo Nome' })).rejects.toThrow(
      RecursoNaoEncontradoError,
    );
  });

  it('atualiza nome, perfil e status', async () => {
    const usuario = await cadastrarUsuario();

    const atualizado = await useCase.executar(usuario.id, {
      nome: 'Maria Souza',
      perfil: PerfilUsuario.GESTOR_OPERACIONAL,
      status: StatusUsuario.INATIVO,
    });

    expect(atualizado.nome).toBe('Maria Souza');
    expect(atualizado.perfil).toBe(PerfilUsuario.GESTOR_OPERACIONAL);
    expect(atualizado.status).toBe(StatusUsuario.INATIVO);
  });

  it('rejeita alterar para um e-mail já usado por outro usuário', async () => {
    await cadastrarUsuario('ocupado@quimovia.com');
    const usuario = await cadastrarUsuario('livre@quimovia.com');

    await expect(
      useCase.executar(usuario.id, { email: 'ocupado@quimovia.com' }),
    ).rejects.toThrow(ConflitoError);
  });

  it('desbloqueia corretamente ao pedir status ATIVO para um usuário bloqueado', async () => {
    const usuario = await cadastrarUsuario();
    usuario.bloquear();
    await usuarios.atualizar(usuario);

    const atualizado = await useCase.executar(usuario.id, { status: StatusUsuario.ATIVO });

    expect(atualizado.status).toBe(StatusUsuario.ATIVO);
  });
});
