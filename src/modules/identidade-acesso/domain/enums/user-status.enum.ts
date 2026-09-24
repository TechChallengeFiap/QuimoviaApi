/** Situação atual do usuário dentro do sistema. */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export const USER_STATUSES = Object.values(UserStatus);
