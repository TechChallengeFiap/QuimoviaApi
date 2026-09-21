import { Module } from '@nestjs/common';
import { AppController } from './app.controller.ts';
import { AppService } from './app.service.ts';
import { PrismaModule } from './prisma/prisma.module.ts';
import { UsuariosModule } from './presentation/usuarios/usuarios.module.ts';

@Module({
  imports: [PrismaModule, UsuariosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
