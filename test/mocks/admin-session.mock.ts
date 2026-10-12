import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export const ADMIN_EMAIL = 'admin@quimovia.com';
export const ADMIN_PASSWORD = 'S3nhaForte!';

/**
 * Cadastra um Administrador do Sistema no repositório em memória e faz login
 * com ele, devolvendo o token de acesso exigido nas rotas de gestão de
 * usuários. Espera o PasswordHasherMock no lugar do hash real.
 */
export async function loginAsAdmin(
  app: INestApplication,
  users: UserRepository,
): Promise<string> {
  await users.create(
    User.create({
      name: 'Administrador do Sistema',
      email: ADMIN_EMAIL,
      passwordHash: `hash:${ADMIN_PASSWORD}`,
      role: UserRole.SYSTEM_ADMIN,
    }),
  );

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .expect(200);

  return response.body.accessToken as string;
}
