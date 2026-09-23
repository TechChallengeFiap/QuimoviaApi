import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller.js';
import { AppService } from '@/app.service.js';
import { ChemicalShipmentModule } from '@/chemical-shipment.module.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ChemicalShipmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
