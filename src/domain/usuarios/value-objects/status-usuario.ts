/** Situação atual do usuário dentro do sistema. */
export enum StatusUsuario {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export const STATUS_USUARIO = Object.values(StatusUsuario);
