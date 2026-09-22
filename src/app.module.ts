import { Module } from '@nestjs/common';
import { AppController } from './app.controller.ts';
import { AppService } from './app.service.ts';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module.ts';
import { IdentidadeAcessoModule } from './modules/identidade-acesso/identidade-acesso.module.ts';

@Module({
  imports: [PrismaModule, IdentidadeAcessoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
