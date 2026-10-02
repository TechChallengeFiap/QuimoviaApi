/**
 * Perfil/Cargo do usuário, que define o conjunto de ações permitidas a ele
 * dentro do sistema.
 */
export enum UserRole {
  PORT_OPERATOR = 'PORT_OPERATOR',
  SHIPPER_DRIVER = 'SHIPPER_DRIVER',
  TECHNICAL_MANAGER = 'TECHNICAL_MANAGER',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export const USER_ROLES = Object.values(UserRole);
