import type { Request } from 'express';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';

/** Requisição que passou pelo guard de autenticação. */
export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedSession;
}
