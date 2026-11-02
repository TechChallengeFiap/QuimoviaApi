export interface UserSummary {
  id: string;
  name: string;
}

/** Dados de identidade publicados para os demais contextos. */
export interface UserDirectory {
  findById(id: string): Promise<UserSummary | null>;
  findByIds(ids: readonly string[]): Promise<UserSummary[]>;
}

export const USER_DIRECTORY = Symbol('UserDirectory');
