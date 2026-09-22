import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordHasher } from '../../application/contracts/password-hasher.contract.js';

const derivarChave = promisify(scrypt) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO_DO_SAL = 16;
const TAMANHO_DA_CHAVE = 64;

/**
 * Implementação de hashing baseada em scrypt (node:crypto), sem dependências
 * externas. O hash é armazenado no formato "<sal em hex>:<chave em hex>".
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(senha: string): Promise<string> {
    const sal = randomBytes(TAMANHO_DO_SAL);
    const chave = await derivarChave(senha, sal, TAMANHO_DA_CHAVE);

    return `${sal.toString('hex')}:${chave.toString('hex')}`;
  }

  async verify(senha: string, hash: string): Promise<boolean> {
    const [salEmHex, chaveEmHex] = hash.split(':');

    if (!salEmHex || !chaveEmHex) {
      return false;
    }

    const chaveArmazenada = Buffer.from(chaveEmHex, 'hex');
    const chaveInformada = await derivarChave(
      senha,
      Buffer.from(salEmHex, 'hex'),
      chaveArmazenada.length,
    );

    return timingSafeEqual(chaveArmazenada, chaveInformada);
  }
}
