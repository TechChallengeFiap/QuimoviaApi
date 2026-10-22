import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';
import { DocumentComplianceModule } from '@/modules/document-compliance/document-compliance.module.js';
import { UserModule } from '@/modules/user/user.module.js';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { ChemicalProductsModule } from '@/modules/chemical-products/chemical-products.module.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module.js';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ChemicalShipmentModule,
    InspectionModule,
    DocumentComplianceModule,
    ChemicalProductsModule,
    AuthModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
