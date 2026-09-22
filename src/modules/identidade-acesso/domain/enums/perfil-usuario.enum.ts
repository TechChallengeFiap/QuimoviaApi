/**
 * Perfil/Cargo do usuário, que define o conjunto de ações permitidas a ele
 * dentro do sistema.
 */
export enum PerfilUsuario {
  OPERADOR_PORTUARIO = 'OPERADOR_PORTUARIO',
  EMBARCADOR_MOTORISTA = 'EMBARCADOR_MOTORISTA',
  RESPONSAVEL_TECNICO = 'RESPONSAVEL_TECNICO',
  GESTOR_OPERACIONAL = 'GESTOR_OPERACIONAL',
  ADMINISTRADOR_SISTEMA = 'ADMINISTRADOR_SISTEMA',
}

export const PERFIS_USUARIO = Object.values(PerfilUsuario);
