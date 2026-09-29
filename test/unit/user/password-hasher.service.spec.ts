import { ScryptPasswordHasher } from '@/modules/user/infrastructure/services/password-hasher.service.js';

describe('ScryptPasswordHasher', () => {
  const passwordHasher = new ScryptPasswordHasher();

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const hash1 = await passwordHasher.hash('S3nhaForte!');
    const hash2 = await passwordHasher.hash('S3nhaForte!');

    expect(hash1).not.toBe(hash2);
  });

  it('verifica corretamente a senha correta e rejeita a incorreta', async () => {
    const hash = await passwordHasher.hash('S3nhaForte!');

    await expect(passwordHasher.verify('S3nhaForte!', hash)).resolves.toBe(
      true,
    );
    await expect(passwordHasher.verify('outraSenha', hash)).resolves.toBe(
      false,
    );
  });

  it('rejeita um hash em formato inválido', async () => {
    await expect(
      passwordHasher.verify('qualquer', 'formato-invalido'),
    ).resolves.toBe(false);
  });
});
