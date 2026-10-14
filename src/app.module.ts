import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { UserModule } from '@/modules/user/user.module.js';

@Module({
  imports: [PrismaModule, UserModule, ChemicalShipmentModule, InspectionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
