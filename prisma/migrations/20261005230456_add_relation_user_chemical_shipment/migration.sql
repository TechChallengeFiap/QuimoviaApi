-- CreateIndex
CREATE INDEX `ChemicalShipment_responsibleUserId_idx` ON `ChemicalShipment`(`responsibleUserId`);

-- AddForeignKey
ALTER TABLE `ChemicalShipment` ADD CONSTRAINT `ChemicalShipment_responsibleUserId_fkey` FOREIGN KEY (`responsibleUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
