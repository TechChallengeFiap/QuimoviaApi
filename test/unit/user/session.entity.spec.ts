import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

describe('Session', () => {
  const startedAt = new Date('2026-10-07T12:00:00.000Z');

  function startSession(): Session {
    return Session.start({
      userId: 'user-001',
      durationInSeconds: 3600,
      startedAt,
    });
  }

  it('inicia a sessão vinculada ao usuário, com prazo a partir do início', () => {
    const session = startSession();

    expect(session.id).toEqual(expect.any(String));
    expect(session.toObject()).toEqual({
      id: session.id,
      userId: 'user-001',
      createdAt: startedAt,
      expiresAt: new Date('2026-10-07T13:00:00.000Z'),
      endedAt: null,
    });
  });

  it('gera um identificador diferente para cada sessão', () => {
    expect(startSession().id).not.toBe(startSession().id);
  });

  it('exige o usuário da sessão', () => {
    expect(() =>
      Session.start({ userId: '  ', durationInSeconds: 3600 }),
    ).toThrow(BusinessRuleError);
  });

  it.each([0, -60, 1.5, Number.NaN])(
    'rejeita a duração de %s segundos',
    (durationInSeconds) => {
      expect(() =>
        Session.start({ userId: 'user-001', durationInSeconds }),
      ).toThrow(BusinessRuleError);
    },
  );

  it('fica ativa até o fim do prazo', () => {
    const session = startSession();

    expect(session.isActive(new Date('2026-10-07T12:59:59.999Z'))).toBe(true);
    expect(session.isActive(new Date('2026-10-07T13:00:00.000Z'))).toBe(false);
  });

  it('deixa de valer ao ser encerrada, mesmo dentro do prazo', () => {
    const session = startSession();
    const endedAt = new Date('2026-10-07T12:30:00.000Z');

    session.end(endedAt);

    expect(session.endedAt).toEqual(endedAt);
    expect(session.isActive(new Date('2026-10-07T12:31:00.000Z'))).toBe(false);
  });

  it('mantém a data do primeiro encerramento', () => {
    const session = startSession();
    const firstEnd = new Date('2026-10-07T12:30:00.000Z');

    session.end(firstEnd);
    session.end(new Date('2026-10-07T12:45:00.000Z'));

    expect(session.endedAt).toEqual(firstEnd);
  });

  it('reconstrói uma sessão persistida sem alterar os dados', () => {
    const properties = {
      id: 'session-001',
      userId: 'user-001',
      createdAt: startedAt,
      expiresAt: new Date('2026-10-07T13:00:00.000Z'),
      endedAt: new Date('2026-10-07T12:10:00.000Z'),
    };

    expect(Session.restore(properties).toObject()).toEqual(properties);
  });
});
