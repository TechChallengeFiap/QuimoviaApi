import { Injectable } from '@nestjs/common';
import {
  UserRepository,
  UserSearchFilters,
  UserPage,
} from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';
import type { UserModel as PersistedUser } from '@/generated/prisma/models.ts';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.ts';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    });

    return PrismaUserRepository.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    });

    return PrismaUserRepository.toDomain(record);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });

    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });

    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async list(filters: UserSearchFilters): Promise<UserPage> {
    const where = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: records.map((record) => PrismaUserRepository.toDomain(record)),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private static toDomain(record: PersistedUser): User {
    return User.restore({
      id: record.id,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      status: record.status as UserStatus,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
