import { Usuario } from '../../../src/modules/identidade-acesso/domain/entities/usuario.entity.js';
import { PerfilUsuario } from '../../../src/modules/identidade-acesso/domain/enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../../../src/modules/identidade-acesso/domain/enums/status-usuario.enum.js';
import { RegraDeNegocioError } from '../../../src/shared/domain/errors/dominio.error.js';

function criarUsuarioValido(sobrescreve: Partial<Parameters<typeof Usuario.criar>[0]> = {}) {
  return Usuario.criar({
    nome: 'Maria Silva',
    email: 'MARIA.silva@quimovia.com',
    senhaHash: 'hash-fake',
    perfil: PerfilUsuario.OPERADOR_PORTUARIO,
    ...sobrescreve,
  });
}

describe('Usuario', () => {
  it('cria um usuário ativo por padrão, com o e-mail normalizado', () => {
    const usuario = criarUsuarioValido();

    expect(usuario.status).toBe(StatusUsuario.ATIVO);
    expect(usuario.email).toBe('maria.silva@quimovia.com');
    expect(usuario.id).toEqual(expect.any(String));
  });

  it('rejeita nome menor que 3 caracteres', () => {
    expect(() => criarUsuarioValido({ nome: 'Al' })).toThrow(RegraDeNegocioError);
  });

  it('rejeita e-mail em formato inválido', () => {
    expect(() => criarUsuarioValido({ email: 'invalido' })).toThrow(RegraDeNegocioError);
  });

  it('não permite ativar um usuário bloqueado diretamente', () => {
    const usuario = criarUsuarioValido();
    usuario.bloquear();

    expect(() => usuario.ativar()).toThrow(RegraDeNegocioError);
  });

  it('permite desbloquear um usuário bloqueado', () => {
    const usuario = criarUsuarioValido();
    usuario.bloquear();
    usuario.desbloquear();

    expect(usuario.status).toBe(StatusUsuario.ATIVO);
  });

  it('só permite autenticação quando o usuário está ativo', () => {
    const usuario = criarUsuarioValido();
    usuario.desativar();

    expect(usuario.podeAutenticar()).toBe(false);
    expect(() => usuario.registrarLogin()).toThrow(RegraDeNegocioError);
  });

  it('registra o momento do último login ao autenticar', () => {
    const usuario = criarUsuarioValido();
    const momento = new Date('2026-01-01T10:00:00Z');

    usuario.registrarLogin(momento);

    expect(usuario.ultimoLogin).toEqual(momento);
  });
});
