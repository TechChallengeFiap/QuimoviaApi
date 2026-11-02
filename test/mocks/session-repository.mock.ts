import type { Session } from '@/modules/user/domain/entities/session.entity.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';

/** Implementação em memória de SessionRepository, para uso nos testes. */
export class SessionRepositoryMock implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async create(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
  }

  async update(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async endAllByUserId(userId: string, endedAt: Date): Promise<number> {
    const openSessions = [...this.sessions.values()].filter(
      (session) => session.userId === userId && session.endedAt === null,
    );

    for (const session of openSessions) {
      session.end(endedAt);
    }

    return openSessions.length;
  }
}
