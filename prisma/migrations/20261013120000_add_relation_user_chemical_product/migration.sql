-- AlterTable
ALTER TABLE `ChemicalProduct` ADD COLUMN `responsibleUserId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `ChemicalProduct_responsibleUserId_idx` ON `ChemicalProduct`(`responsibleUserId`);

-- AddForeignKey
ALTER TABLE `ChemicalProduct` ADD CONSTRAINT `ChemicalProduct_responsibleUserId_fkey` FOREIGN KEY (`responsibleUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

