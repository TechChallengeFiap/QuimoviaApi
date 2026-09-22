import { randomUUID } from 'node:crypto';
import { RegraDeNegocioError } from '#shared/domain/errors/dominio.error.js';
import { PerfilUsuario } from '../enums/perfil-usuario.enum.js';
import { StatusUsuario } from '../enums/status-usuario.enum.js';

const TAMANHO_MINIMO_NOME = 3;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PropriedadesUsuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  ultimoLogin: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DadosDeCriacaoDeUsuario {
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  status?: StatusUsuario;
}

/**
 * Raiz do agregado Usuário.
 *
 * Concentra as invariantes do cadastro e do controle de acesso: nenhum atributo
 * é alterado sem passar por um de seus métodos. A unicidade do e-mail é a única
 * regra que a entidade não consegue garantir sozinha — ela depende do
 * repositório, que consulta o conjunto completo de usuários.
 */
export class Usuario {
  readonly id: string;
  readonly criadoEm: Date;

  #nome: string;
  #email: string;
  #senhaHash: string;
  #perfil: PerfilUsuario;
  #status: StatusUsuario;
  #ultimoLogin: Date | null;
  #atualizadoEm: Date;

  private constructor(propriedades: PropriedadesUsuario) {
    this.id = propriedades.id;
    this.criadoEm = propriedades.criadoEm;
    this.#nome = propriedades.nome;
    this.#email = propriedades.email;
    this.#senhaHash = propriedades.senhaHash;
    this.#perfil = propriedades.perfil;
    this.#status = propriedades.status;
    this.#ultimoLogin = propriedades.ultimoLogin;
    this.#atualizadoEm = propriedades.atualizadoEm;
  }

  /** Cria um novo usuário, validando os dados informados. */
  static criar(dados: DadosDeCriacaoDeUsuario): Usuario {
    const agora = new Date();

    const usuario = new Usuario({
      id: randomUUID(),
      nome: Usuario.validarNome(dados.nome),
      email: Usuario.validarEmail(dados.email),
      senhaHash: Usuario.validarSenhaHash(dados.senhaHash),
      perfil: dados.perfil,
      status: dados.status ?? StatusUsuario.ATIVO,
      ultimoLogin: null,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    return usuario;
  }

  /** Reconstrói um usuário já persistido, sem revalidar os dados. */
  static restaurar(propriedades: PropriedadesUsuario): Usuario {
    return new Usuario(propriedades);
  }

  get nome(): string {
    return this.#nome;
  }

  get email(): string {
    return this.#email;
  }

  get senhaHash(): string {
    return this.#senhaHash;
  }

  get perfil(): PerfilUsuario {
    return this.#perfil;
  }

  get status(): StatusUsuario {
    return this.#status;
  }

  get ultimoLogin(): Date | null {
    return this.#ultimoLogin;
  }

  get atualizadoEm(): Date {
    return this.#atualizadoEm;
  }

  renomear(nome: string): void {
    this.#nome = Usuario.validarNome(nome);
    this.marcarComoAtualizado();
  }

  alterarEmail(email: string): void {
    this.#email = Usuario.validarEmail(email);
    this.marcarComoAtualizado();
  }

  alterarSenha(senhaHash: string): void {
    this.#senhaHash = Usuario.validarSenhaHash(senhaHash);
    this.marcarComoAtualizado();
  }

  alterarPerfil(perfil: PerfilUsuario): void {
    this.#perfil = perfil;
    this.marcarComoAtualizado();
  }

  /**
   * Um usuário bloqueado não volta a ser ativo automaticamente: o desbloqueio
   * é uma decisão explícita do Administrador do Sistema.
   */
  ativar(): void {
    if (this.#status === StatusUsuario.BLOQUEADO) {
      throw new RegraDeNegocioError(
        'Um usuário bloqueado não pode ser ativado diretamente; é necessário desbloqueá-lo.',
      );
    }

    this.alterarStatus(StatusUsuario.ATIVO);
  }

  desativar(): void {
    this.alterarStatus(StatusUsuario.INATIVO);
  }

  bloquear(): void {
    this.alterarStatus(StatusUsuario.BLOQUEADO);
  }

  desbloquear(): void {
    if (this.#status !== StatusUsuario.BLOQUEADO) {
      throw new RegraDeNegocioError('Apenas um usuário bloqueado pode ser desbloqueado.');
    }

    this.alterarStatus(StatusUsuario.ATIVO);
  }

  /** Somente um usuário ativo pode autenticar-se e abrir novas sessões. */
  podeAutenticar(): boolean {
    return this.#status === StatusUsuario.ATIVO;
  }

  registrarLogin(momento: Date = new Date()): void {
    if (!this.podeAutenticar()) {
      throw new RegraDeNegocioError(
        `Usuário com status ${this.#status} não pode autenticar-se no sistema.`,
      );
    }

    this.#ultimoLogin = momento;
    this.marcarComoAtualizado();
  }

  paraObjeto(): PropriedadesUsuario {
    return {
      id: this.id,
      nome: this.#nome,
      email: this.#email,
      senhaHash: this.#senhaHash,
      perfil: this.#perfil,
      status: this.#status,
      ultimoLogin: this.#ultimoLogin,
      criadoEm: this.criadoEm,
      atualizadoEm: this.#atualizadoEm,
    };
  }

  private alterarStatus(status: StatusUsuario): void {
    if (this.#status === status) {
      return;
    }

    this.#status = status;
    this.marcarComoAtualizado();
  }

  private marcarComoAtualizado(): void {
    this.#atualizadoEm = new Date();
  }

  private static validarNome(nome: string): string {
    const nomeNormalizado = nome.trim();

    if (nomeNormalizado.length < TAMANHO_MINIMO_NOME) {
      throw new RegraDeNegocioError(
        `O nome do usuário deve ter ao menos ${TAMANHO_MINIMO_NOME} caracteres.`,
      );
    }

    return nomeNormalizado;
  }

  private static validarEmail(email: string): string {
    const emailNormalizado = email.trim().toLowerCase();

    if (!FORMATO_EMAIL.test(emailNormalizado)) {
      throw new RegraDeNegocioError(`O e-mail "${email}" não é válido.`);
    }

    return emailNormalizado;
  }

  private static validarSenhaHash(senhaHash: string): string {
    if (senhaHash.trim().length === 0) {
      throw new RegraDeNegocioError('O hash da senha do usuário não pode ser vazio.');
    }

    return senhaHash;
  }
}
