import type { HashDeSenha } from '../../src/application/usuarios/contracts/hash-de-senha.js';

/** Hash falso e reversível, apenas para tornar os testes determinísticos. */
export class HashDeSenhaMock implements HashDeSenha {
  async gerar(senha: string): Promise<string> {
    return `hash:${senha}`;
  }

  async verificar(senha: string, hash: string): Promise<boolean> {
    return hash === `hash:${senha}`;
  }
}
