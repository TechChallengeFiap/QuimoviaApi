-- CreateTable
CREATE TABLE `ChemicalShipment` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `status` ENUM('ANALYZING', 'INSPECTION', 'APPROVED', 'REPROVED', 'BLOCKED', 'RELEASED') NOT NULL DEFAULT 'ANALYZING',
    `responsibleUserId` VARCHAR(191) NOT NULL,
    `documentsIds` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
