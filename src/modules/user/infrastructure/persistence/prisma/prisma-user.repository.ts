import { Inject, Injectable } from '@nestjs/common';
import {
  UserRepository,
  UserSearchFilters,
  UserPage,
} from '@/modules/user/domain/repositories/user.repository.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type { UserModel as PersistedUser } from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
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
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
      },
    });

    return PrismaUserRepository.toDomain(record);
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
    });

    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email, isDeleted: false },
    });

    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });

    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async registerLogin(user: User): Promise<boolean> {
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, status: UserStatus.ACTIVE, isDeleted: false },
      data: { lastLoginAt: user.lastLoginAt },
    });

    return count === 1;
  }

  async list(filters: UserSearchFilters): Promise<UserPage> {
    const where = {
      isDeleted: false,
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
      // isDeleted é o que filtra as buscas; sem a data, vale a da última
      // alteração.
      deletedAt: record.isDeleted
        ? (record.deletedAt ?? record.updatedAt)
        : null,
    });
  }
}
