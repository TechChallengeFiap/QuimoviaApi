-- Cria a tabela de documentação das cargas.
CREATE TABLE `CargoDocument` (
    `id` VARCHAR(191) NOT NULL,
    `cargoId` VARCHAR(191) NOT NULL,
    `shipperId` VARCHAR(191) NOT NULL,
    `compositionVersion` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'COMPLIANT', 'NON_COMPLIANT') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CargoDocument_cargoId_key`(`cargoId`),
    INDEX `CargoDocument_shipperId_status_idx`(`shipperId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Cria a tabela de versões dos anexos.
CREATE TABLE `CargoDocumentAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `cargoDocumentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `type` ENUM('SAFETY_DATA_SHEET', 'CERTIFICATE', 'LICENSE', 'DECLARATION', 'OTHER') NOT NULL,
    `fileReference` VARCHAR(1024) NOT NULL,
    `scopes` JSON NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `replacesAttachmentId` VARCHAR(191) NULL,
    `removedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CargoDocumentAttachment_cargoDocumentId_idx`(`cargoDocumentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vincula cada anexo à documentação correspondente.
ALTER TABLE `CargoDocumentAttachment` ADD CONSTRAINT `CargoDocumentAttachment_cargoDocumentId_fkey` FOREIGN KEY (`cargoDocumentId`) REFERENCES `CargoDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
