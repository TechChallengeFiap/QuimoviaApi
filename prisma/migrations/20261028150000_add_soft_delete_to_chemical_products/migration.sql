-- AlterTable
ALTER TABLE `ChemicalProduct` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `ChemicalProduct_deletedAt_idx` ON `ChemicalProduct`(`deletedAt`);

