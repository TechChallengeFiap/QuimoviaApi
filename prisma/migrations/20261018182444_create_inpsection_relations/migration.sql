-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `ChemicalShipment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_inspectorId_fkey` FOREIGN KEY (`inspectorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
