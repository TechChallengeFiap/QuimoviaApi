import { Module } from '@nestjs/common';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { UserModule } from '@/modules/user/user.module.js';

@Module({
  imports: [UserModule, ChemicalShipmentModule, InspectionModule],
})
export class AppModule {}
