-- CreateTable
CREATE TABLE `Lot` (
    `id` VARCHAR(191) NOT NULL,
    `chemicalProductId` VARCHAR(191) NOT NULL,
    `lotNumber` VARCHAR(60) NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,
    `status` ENUM('RECEIVED', 'UNDER_INSPECTION', 'AVAILABLE', 'RESERVED', 'IN_STORAGE', 'QUARANTINED', 'RELEASED', 'EXPIRED', 'DISPOSED') NOT NULL DEFAULT 'RECEIVED',
    `reservedForOperationId` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Lot_chemicalProductId_status_idx`(`chemicalProductId`, `status`),
    UNIQUE INDEX `Lot_chemicalProductId_lotNumber_key`(`chemicalProductId`, `lotNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lot` ADD CONSTRAINT `Lot_chemicalProductId_fkey` FOREIGN KEY (`chemicalProductId`) REFERENCES `ChemicalProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

