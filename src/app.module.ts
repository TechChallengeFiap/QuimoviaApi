import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.ts';
import { IdentidadeAcessoModule } from '@/modules/identidade-acesso/identidade-acesso.module.ts';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.ts';
import { ProdutosQuimicosModule } from '@/modules/produtos-quimicos/produtos-quimicos.module.js';

@Module({
  imports: [
    PrismaModule,
    IdentidadeAcessoModule,
    ChemicalShipmentModule,
    ProdutosQuimicosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
