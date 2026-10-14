import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { AuthGuard } from '@/modules/user/infrastructure/auth/auth.guard.js';
import { CurrentSession } from '@/modules/user/infrastructure/auth/current-session.decorator.js';

/**
 * Rota de outro módulo protegida pelo AuthGuard, do jeito que os módulos da
 * aplicação devem usá-lo: importando o AuthModule e aplicando
 * @UseGuards(AuthGuard) no controller.
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
  imports: [AuthModule],
  controllers: [ProtectedRouteController],
})
export class ProtectedRouteModule {}
