import { JwtService } from '@nestjs/jwt';
import { JwtAccessTokenService } from '@/modules/user/infrastructure/services/jwt-access-token.service.js';

describe('JwtAccessTokenService', () => {
  const secret = 'segredo-de-teste-com-mais-de-32-caracteres';
  const claims = { userId: 'user-001', sessionId: 'session-001' };
  const jwt = new JwtService();
  const service = new JwtAccessTokenService(jwt, {
    jwtSecret: secret,
    sessionDurationInSeconds: 3600,
  });

  function inOneHour(): Date {
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  it('emite um token HS256 que expira junto com a sessão', async () => {
    const expiresAt = inOneHour();

    const token = await service.issue(claims, expiresAt);
    const decoded = jwt.decode<{
      header: { alg: string };
      payload: Record<string, unknown>;
    }>(token, { complete: true });

    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload).toMatchObject({
      sub: 'user-001',
      sid: 'session-001',
      exp: Math.floor(expiresAt.getTime() / 1000),
    });
  });

  it('valida o token emitido e devolve o usuário e a sessão', async () => {
    const token = await service.issue(claims, inOneHour());

    await expect(service.verify(token)).resolves.toEqual(claims);
  });

  it('recusa um token expirado', async () => {
    const token = await service.issue(claims, new Date(Date.now() - 1000));

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('recusa um token assinado com outro segredo', async () => {
    const token = await jwt.signAsync(
      { sub: 'user-001', sid: 'session-001' },
      { secret: 'outro-segredo-com-mais-de-32-caracteres', expiresIn: 60 },
    );

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('recusa um token alterado depois de assinado', async () => {
    const token = await service.issue(claims, inOneHour());
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin-001', sid: 'session-001', exp: 4102444800 }),
    ).toString('base64url');

    await expect(
      service.verify(`${header}.${forgedPayload}.${signature}`),
    ).resolves.toBeNull();
  });

  it('recusa um token assinado com outro algoritmo', async () => {
    const token = await jwt.signAsync(
      { sub: 'user-001', sid: 'session-001' },
      { secret, algorithm: 'HS512', expiresIn: 60 },
    );

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('recusa um token sem a sessão', async () => {
    const token = await jwt.signAsync(
      { sub: 'user-001' },
      { secret, expiresIn: 60 },
    );

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('recusa um valor que não é um JWT', async () => {
    await expect(service.verify('nao-e-um-token')).resolves.toBeNull();
  });
});
