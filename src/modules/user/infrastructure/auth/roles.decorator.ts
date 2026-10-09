import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';

export const REQUIRED_ROLES = 'requiredRoles';

/**
 * Perfis autorizados a executar a rota (RN-ACE-04). Conferido pelo
 * RolesGuard, que deve vir depois do AuthGuard:
 * @UseGuards(AuthGuard, RolesGuard).
 */
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES, roles);
