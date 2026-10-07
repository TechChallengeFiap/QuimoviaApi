import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE = 'isPublicRoute';

/**
 * Libera a rota da exigência de login feita pelo guard global de
 * autenticação. Use apenas nas rotas que precisam funcionar sem sessão, como
 * o próprio login.
 */
export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
