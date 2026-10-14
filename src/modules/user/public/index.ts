/**
 * API pública do contexto Identidade e Acesso.
 *
 * É o único arquivo deste contexto que outros contextos podem importar. Tudo o
 * que está aqui é contrato: uma alteração precisa considerar os consumidores.
 *
 * Os arquivos internos do contexto não importam este índice, e sim o arquivo
 * de origem, para não criar ciclos de importação.
 */
export { UserModule } from '@/modules/user/user.module.js';

// Consulta de usuários
export { USER_DIRECTORY } from '@/modules/user/public/user-directory.contract.js';
export type {
  UserDirectory,
  UserSummary,
} from '@/modules/user/public/user-directory.contract.js';
export { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
export { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
export { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

// Autenticação das rotas de outros contextos
export { AuthGuard } from '@/modules/user/presentation/guards/auth.guard.js';
export { CurrentSession } from '@/modules/user/presentation/decorators/current-session.decorator.js';
export { ApiRequiresAuthentication } from '@/modules/user/presentation/decorators/api-requires-authentication.decorator.js';
export type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
