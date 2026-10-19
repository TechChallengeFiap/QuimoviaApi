/*
  Warnings:

  - Added the required column `quantityProduct` to the `ChemicalShipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ChemicalShipment` ADD COLUMN `quantityProduct` FLOAT NOT NULL;

-- AddForeignKey
ALTER TABLE `ChemicalShipment` ADD CONSTRAINT `ChemicalShipment_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `ChemicalProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
