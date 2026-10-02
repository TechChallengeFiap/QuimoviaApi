import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';

/** Hash falso e reversível, apenas para tornar os testes determinísticos. */
export class PasswordHasherMock implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hash:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hash:${password}`;
  }
}
