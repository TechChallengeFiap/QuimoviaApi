import { Inject, Injectable } from '@nestjs/common';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionModel as PersistedSession } from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(session: Session): Promise<Session> {
    const record = await this.prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        endedAt: session.endedAt,
      },
    });

    return PrismaSessionRepository.toDomain(record);
  }

  /** Depois de criada, a sessão só muda ao ser encerrada. */
  async update(session: Session): Promise<Session> {
    const record = await this.prisma.session.update({
      where: { id: session.id },
      data: { endedAt: session.endedAt },
    });

    return PrismaSessionRepository.toDomain(record);
  }

  async findById(id: string): Promise<Session | null> {
    const record = await this.prisma.session.findUnique({ where: { id } });

    return record ? PrismaSessionRepository.toDomain(record) : null;
  }

  async endAllByUserId(userId: string, endedAt: Date): Promise<number> {
    const { count } = await this.prisma.session.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt },
    });

    return count;
  }

  private static toDomain(record: PersistedSession): Session {
    return Session.restore({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      endedAt: record.endedAt,
    });
  }
}
