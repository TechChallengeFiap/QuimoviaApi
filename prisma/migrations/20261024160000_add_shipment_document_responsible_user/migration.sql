-- AlterTable
ALTER TABLE `CargoDocument` ADD COLUMN `responsibleUserId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CargoDocument_responsibleUserId_idx` ON `CargoDocument`(`responsibleUserId`);

-- AddForeignKey
ALTER TABLE `CargoDocument` ADD CONSTRAINT `CargoDocument_responsibleUserId_fkey` FOREIGN KEY (`responsibleUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
