import { ScryptHashDeSenha } from '../../src/infrastructure/shared/crypto/scrypt-hash-de-senha.js';

describe('ScryptHashDeSenha', () => {
  const hashDeSenha = new ScryptHashDeSenha();

  it('gera hashes diferentes para a mesma senha (sal aleatório)', async () => {
    const hash1 = await hashDeSenha.gerar('S3nhaForte!');
    const hash2 = await hashDeSenha.gerar('S3nhaForte!');

    expect(hash1).not.toBe(hash2);
  });

  it('verifica corretamente a senha correta e rejeita a incorreta', async () => {
    const hash = await hashDeSenha.gerar('S3nhaForte!');

    await expect(hashDeSenha.verificar('S3nhaForte!', hash)).resolves.toBe(true);
    await expect(hashDeSenha.verificar('outraSenha', hash)).resolves.toBe(false);
  });

  it('rejeita um hash em formato inválido', async () => {
    await expect(hashDeSenha.verificar('qualquer', 'formato-invalido')).resolves.toBe(false);
  });
});
