/**
 * Porta de hashing de senhas.
 *
 * Mantém o algoritmo fora dos casos de uso, permitindo trocá-lo sem tocar nas
 * regras de negócio.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
