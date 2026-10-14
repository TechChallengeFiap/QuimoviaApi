import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  CurrentSession,
  UserModule,
  type AuthenticatedSession,
} from '@/modules/user/public/index.js';

/**
 * Rota de outro contexto protegida pelo AuthGuard, do jeito que os módulos da
 * aplicação devem usá-lo: importando o UserModule pela API pública de
 * Identidade e Acesso e aplicando @UseGuards(AuthGuard) no controller.
 */
@Controller('rota-protegida')
@UseGuards(AuthGuard)
export class ProtectedRouteController {
  @Get()
  current(
    @CurrentSession() session: AuthenticatedSession,
  ): AuthenticatedSession {
    return session;
  }
}

@Module({
  imports: [UserModule],
  controllers: [ProtectedRouteController],
})
export class ProtectedRouteModule {}
