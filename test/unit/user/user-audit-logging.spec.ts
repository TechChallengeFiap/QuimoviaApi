import { beforeEach, describe, expect, it } from '@jest/globals';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { ChangeUserRoleUseCase } from '@/modules/user/application/use-cases/users/change-user-role.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { LoginUseCase } from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { LogoutUseCase } from '@/modules/user/application/use-cases/auth/logout.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { PasswordHasherMock } from '../../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../../mocks/session-repository.mock.js';
import { AccessTokenServiceMock } from '../../mocks/access-token-service.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';

describe('User & Auth Audit Logging (unit)', () => {
  let userRepo: UserRepositoryMock;
  let sessionRepo: SessionRepositoryMock;
  let passwordHasher: PasswordHasherMock;
  let tokenService: AccessTokenServiceMock;
  let auditLogs: AuditLogRecorderMock;

  beforeEach(() => {
    userRepo = new UserRepositoryMock();
    sessionRepo = new SessionRepositoryMock();
    passwordHasher = new PasswordHasherMock();
    tokenService = new AccessTokenServiceMock();
    auditLogs = new AuditLogRecorderMock();
  });

  it('registra log ao criar usuário', async () => {
    const useCase = new CreateUserUseCase(userRepo, passwordHasher, auditLogs);

    const created = await useCase.execute(
      {
        name: 'Maria Auditora',
        email: 'maria@empresa.com',
        password: 'Password123!',
        role: UserRole.TECHNICAL_MANAGER,
      },
      { id: 'admin-id', name: 'Admin Root' },
    );

    expect(created).toBeDefined();
    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      entityId: created.id,
      actorId: 'admin-id',
      actorName: 'Admin Root',
      action: AuditAction.CREATED,
    });
    expect(auditLogs.logs[0].description).toContain('Admin Root');
    expect(auditLogs.logs[0].description).toContain('Maria Auditora');
  });

  it('registra log ao atualizar usuário', async () => {
    const user = User.restore({
      id: 'user-1',
      name: 'Nome Antigo',
      email: 'antigo@empresa.com',
      passwordHash: 'hash',
      role: UserRole.PORT_OPERATOR,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.create(user);

    const useCase = new UpdateUserUseCase(
      userRepo,
      passwordHasher,
      sessionRepo,
      auditLogs,
    );

    await useCase.execute(
      'user-1',
      { name: 'Nome Novo' },
      { userId: 'admin-id', role: UserRole.SYSTEM_ADMIN },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      entityId: 'user-1',
      action: AuditAction.UPDATED,
    });
  });

  it('registra log ao alterar perfil do usuário', async () => {
    const user = User.restore({
      id: 'user-1',
      name: 'Operador Silva',
      email: 'silva@empresa.com',
      passwordHash: 'hash',
      role: UserRole.PORT_OPERATOR,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.create(user);

    const useCase = new ChangeUserRoleUseCase(userRepo, auditLogs);

    await useCase.execute('user-1', UserRole.TECHNICAL_MANAGER, {
      id: 'admin-id',
      name: 'Admin Root',
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      action: AuditAction.ROLE_CHANGED,
    });
    expect(auditLogs.logs[0].description).toContain('TECHNICAL_MANAGER');
  });

  it('registra log ao remover usuário', async () => {
    const user = User.restore({
      id: 'user-1',
      name: 'Para Deletar',
      email: 'deletar@empresa.com',
      passwordHash: 'hash',
      role: UserRole.PORT_OPERATOR,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.create(user);

    const useCase = new DeleteUserUseCase(userRepo, auditLogs);

    await useCase.execute('user-1', { id: 'admin-id', name: 'Admin Root' });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      action: AuditAction.DELETED,
    });
  });

  it('registra log ao fazer login com sucesso', async () => {
    const user = User.restore({
      id: 'user-1',
      name: 'Carlos Tech',
      email: 'carlos@empresa.com',
      passwordHash: 'hash:S3nhaForte!',
      role: UserRole.TECHNICAL_MANAGER,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.create(user);

    const useCase = new LoginUseCase(
      userRepo,
      sessionRepo,
      passwordHasher,
      tokenService,
      { durationInSeconds: 3600 },
      auditLogs,
    );

    await useCase.execute({
      email: 'carlos@empresa.com',
      password: 'S3nhaForte!',
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      entityId: 'user-1',
      action: AuditAction.LOGGED_IN,
    });
    expect(auditLogs.logs[0].description).toContain(
      'realizou login no sistema',
    );
  });

  it('registra log ao encerrar sessão (logout)', async () => {
    const user = User.restore({
      id: 'user-1',
      name: 'Carlos Tech',
      email: 'carlos@empresa.com',
      passwordHash: 'hash:S3nhaForte!',
      role: UserRole.TECHNICAL_MANAGER,
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.create(user);

    const session = await sessionRepo.create(
      Session.start({ userId: 'user-1', durationInSeconds: 3600 }),
    );

    const useCase = new LogoutUseCase(sessionRepo, userRepo, auditLogs);

    await useCase.execute(session.id, 'user-1');

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      entityId: 'user-1',
      action: AuditAction.LOGGED_OUT,
    });
    expect(auditLogs.logs[0].description).toContain('logout do sistema');
  });
});
