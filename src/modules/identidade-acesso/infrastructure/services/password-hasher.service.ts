import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordHasher } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.ts';

const deriveKey = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  length: number,
) => Promise<Buffer>;

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Implementação de hashing baseada em scrypt (node:crypto), sem dependências
 * externas. O hash é armazenado no formato "<salt em hex>:<chave em hex>".
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt, KEY_LENGTH);

    return `${salt.toString('hex')}:${key.toString('hex')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [saltHex, keyHex] = hash.split(':');

    if (!saltHex || !keyHex) {
      return false;
    }

    const storedKey = Buffer.from(keyHex, 'hex');
    const providedKey = await deriveKey(
      password,
      Buffer.from(saltHex, 'hex'),
      storedKey.length,
    );

    return timingSafeEqual(storedKey, providedKey);
  }
}
