/**
 * Porta de hashing de senhas.
 *
 * Mantém o algoritmo fora dos casos de uso, permitindo trocá-lo sem tocar nas
 * regras de negócio.
 */
export interface HashDeSenha {
  gerar(senha: string): Promise<string>;
  verificar(senha: string, hash: string): Promise<boolean>;
}

export const HASH_DE_SENHA = Symbol('HashDeSenha');
