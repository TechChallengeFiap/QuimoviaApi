import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';
import { IdentidadeAcessoModule } from '@/modules/identidade-acesso/identidade-acesso.module.js';
import { ChemicalShipmentModule } from '@/chemical-shipment.module.js';

@Module({
  imports: [PrismaModule, IdentidadeAcessoModule, ChemicalShipmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
