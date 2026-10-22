-- CreateTable
CREATE TABLE `UserLog` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(120) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'LOGGED_IN', 'LOGGED_OUT', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED', 'DOCUMENT_REMOVED') NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserLog_entityId_createdAt_idx`(`entityId`, `createdAt`),
    INDEX `UserLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChemicalProductLog` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(120) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'LOGGED_IN', 'LOGGED_OUT', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED', 'DOCUMENT_REMOVED') NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChemicalProductLog_entityId_createdAt_idx`(`entityId`, `createdAt`),
    INDEX `ChemicalProductLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChemicalShipmentLog` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(120) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'LOGGED_IN', 'LOGGED_OUT', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED', 'DOCUMENT_REMOVED') NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChemicalShipmentLog_entityId_createdAt_idx`(`entityId`, `createdAt`),
    INDEX `ChemicalShipmentLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionLog` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(120) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'LOGGED_IN', 'LOGGED_OUT', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED', 'DOCUMENT_REMOVED') NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InspectionLog_entityId_createdAt_idx`(`entityId`, `createdAt`),
    INDEX `InspectionLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShipmentDocumentLog` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(120) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'LOGGED_IN', 'LOGGED_OUT', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED', 'DOCUMENT_REMOVED') NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ShipmentDocumentLog_entityId_createdAt_idx`(`entityId`, `createdAt`),
    INDEX `ShipmentDocumentLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
