import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { RegisterShipperUseCase } from '@/modules/user/application/use-cases/users/register-shipper.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { AuditLogRecorderMock } from '../../../mocks/audit-log-recorder.mock.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('RegisterShipperUseCase', () => {
  let users: UserRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let useCase: RegisterShipperUseCase;

  const input = {
    name: 'Carlos Pereira',
    email: 'Carlos.Pereira@Transportadora.com',
    password: 'S3nhaForte!',
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    auditLogs = new AuditLogRecorderMock();
    useCase = new RegisterShipperUseCase(
      new CreateUserUseCase(users, new PasswordHasherMock(), auditLogs),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cadastra o embarcador ativo, com o perfil SHIPPER_DRIVER e a senha em hash', async () => {
    const user = await useCase.execute(input);

    expect(user).toMatchObject({
      name: 'Carlos Pereira',
      email: 'carlos.pereira@transportadora.com',
      role: UserRole.SHIPPER_DRIVER,
      status: UserStatus.ACTIVE,
      passwordHash: 'hash:S3nhaForte!',
    });
    expect(await users.findById(user.id)).not.toBeNull();
  });

  it('ignora perfil e status enviados fora do contrato e mantém o perfil fixo', async () => {
    const user = await useCase.execute({
      ...input,
      role: UserRole.SYSTEM_ADMIN,
      status: UserStatus.INACTIVE,
    } as typeof input);

    expect(user.role).toBe(UserRole.SHIPPER_DRIVER);
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('rejeita e-mail já cadastrado', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, name: 'Outro Carlos' }),
    ).rejects.toThrow(ConflictError);
  });

  it('não reativa o cadastro de um usuário excluído', async () => {
    const deleted = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash:S3nhaAntiga!',
        role: UserRole.PORT_OPERATOR,
      }),
    );
    deleted.delete();
    await users.update(deleted);

    await expect(
      useCase.execute({ ...input, email: 'maria@quimovia.com' }),
    ).rejects.toThrow(ConflictError);

    const stored =
      await users.findByEmailIncludingDeleted('maria@quimovia.com');
    expect(stored).toMatchObject({
      id: deleted.id,
      role: UserRole.PORT_OPERATOR,
      passwordHash: 'hash:S3nhaAntiga!',
    });
    expect(stored?.isDeleted).toBe(true);
  });

  it('registra na auditoria o próprio embarcador como autor do cadastro', async () => {
    const user = await useCase.execute(input);

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.USER,
      entityId: user.id,
      actorId: user.id,
      actorName: 'Carlos Pereira',
      action: AuditAction.CREATED,
      description:
        'Usuário "Carlos Pereira" (carlos.pereira@transportadora.com) realizou o próprio cadastro',
      details: { role: UserRole.SHIPPER_DRIVER, status: UserStatus.ACTIVE },
    });
  });
});
