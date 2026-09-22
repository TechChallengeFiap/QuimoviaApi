import type { PasswordHasher } from '../../src/modules/identidade-acesso/application/contracts/password-hasher.contract.js';

/** Hash falso e reversível, apenas para tornar os testes determinísticos. */
export class PasswordHasherMock implements PasswordHasher {
  async hash(senha: string): Promise<string> {
    return `hash:${senha}`;
  }

  async verify(senha: string, hash: string): Promise<boolean> {
    return hash === `hash:${senha}`;
  }
}
