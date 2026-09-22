import { CriarUsuarioUseCase } from '../../../src/modules/identidade-acesso/application/use-cases/criar-usuario.use-case.js';
import { PerfilUsuario } from '../../../src/modules/identidade-acesso/domain/enums/perfil-usuario.enum.js';
import { ConflitoError } from '../../../src/shared/domain/errors/dominio.error.js';
import { PasswordHasherMock } from '../../mocks/password-hasher.mock.js';
import { UsuarioRepositoryMock } from '../../mocks/usuario-repository.mock.js';

describe('CriarUsuarioUseCase', () => {
  let usuarios: UsuarioRepositoryMock;
  let useCase: CriarUsuarioUseCase;

  beforeEach(() => {
    usuarios = new UsuarioRepositoryMock();
    useCase = new CriarUsuarioUseCase(usuarios, new PasswordHasherMock());
  });

  it('cria um usuário com a senha em hash', async () => {
    const usuario = await useCase.executar({
      nome: 'Maria Silva',
      email: 'maria@quimovia.com',
      senha: 'S3nhaForte!',
      perfil: PerfilUsuario.OPERADOR_PORTUARIO,
    });

    expect(usuario.senhaHash).toBe('hash:S3nhaForte!');
    expect(await usuarios.buscarPorId(usuario.id)).not.toBeNull();
  });

  it('rejeita e-mail já cadastrado', async () => {
    const entrada = {
      nome: 'Maria Silva',
      email: 'maria@quimovia.com',
      senha: 'S3nhaForte!',
      perfil: PerfilUsuario.OPERADOR_PORTUARIO,
    };

    await useCase.executar(entrada);

    await expect(useCase.executar({ ...entrada, nome: 'Outra Maria' })).rejects.toThrow(
      ConflitoError,
    );
  });
});
