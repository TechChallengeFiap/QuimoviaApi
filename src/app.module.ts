import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { UserModule } from '@/modules/user/user.module.js';

@Module({
  imports: [UserModule, ChemicalShipmentModule, InspectionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
