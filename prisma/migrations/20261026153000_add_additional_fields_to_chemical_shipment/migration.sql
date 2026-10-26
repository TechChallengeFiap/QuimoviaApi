-- AlterTable
ALTER TABLE `ChemicalShipment`
    ADD COLUMN `code` VARCHAR(60) NOT NULL DEFAULT '',
    ADD COLUMN `unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    ADD COLUMN `origin` VARCHAR(120) NOT NULL DEFAULT 'Porto de Santos',
    ADD COLUMN `destination` VARCHAR(120) NOT NULL DEFAULT 'Terminal Portuário',
    ADD COLUMN `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `ChemicalShipment_code_idx` ON `ChemicalShipment`(`code`);
