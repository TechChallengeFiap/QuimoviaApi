import { Module } from '@nestjs/common';
import { ChemicalShipmentModule } from './chemical-shipment.module.ts';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module.ts';

@Module({
  imports: [PrismaModule, ChemicalShipmentModule],
})
export class AppModule {}
