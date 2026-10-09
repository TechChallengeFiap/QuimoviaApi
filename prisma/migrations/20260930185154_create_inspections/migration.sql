-- CreateTable
CREATE TABLE `Inspection` (
    `id` VARCHAR(191) NOT NULL,
    `cargoId` VARCHAR(191) NOT NULL,
    `compositionVersion` INTEGER NOT NULL,
    `scope` ENUM('CARGO', 'CARGO_ITEM') NOT NULL,
    `cargoItemId` VARCHAR(191) NULL,
    `inspectorId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Inspection_cargoId_idx`(`cargoId`),
    INDEX `Inspection_inspectorId_status_idx`(`inspectorId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionItem` (
    `id` VARCHAR(191) NOT NULL,
    `inspectionId` VARCHAR(191) NOT NULL,
    `requirement` ENUM('EXPIRATION_DATE', 'PACKAGING_INTEGRITY', 'NO_LEAKAGE', 'CORRECT_LABELING', 'TRANSPORT_CONDITIONS', 'SAFETY_EQUIPMENT') NOT NULL,
    `result` ENUM('COMPLIANT', 'NON_COMPLIANT') NULL,
    `observation` VARCHAR(500) NULL,

    UNIQUE INDEX `InspectionItem_inspectionId_requirement_key`(`inspectionId`, `requirement`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InspectionItem` ADD CONSTRAINT `InspectionItem_inspectionId_fkey` FOREIGN KEY (`inspectionId`) REFERENCES `Inspection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

