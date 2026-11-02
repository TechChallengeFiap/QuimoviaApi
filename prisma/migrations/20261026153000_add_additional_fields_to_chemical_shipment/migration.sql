-- AlterTable: adiciona colunas operacionais
ALTER TABLE `ChemicalShipment`
    ADD COLUMN `code` VARCHAR(60) NOT NULL DEFAULT '',
    ADD COLUMN `unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    ADD COLUMN `origin` VARCHAR(120) NOT NULL DEFAULT 'Porto de Santos',
    ADD COLUMN `destination` VARCHAR(120) NOT NULL DEFAULT 'Terminal Portuário',
    ADD COLUMN `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Backfill de entryDate a partir de createdAt para manter histórico correto
UPDATE `ChemicalShipment`
SET `entryDate` = `createdAt`;

-- Backfill de code garantindo identificador único para linhas legadas
UPDATE `ChemicalShipment`
SET `code` = CONCAT('CARGO-', UPPER(SUBSTRING(`id`, 1, 8)))
WHERE `code` = '' OR `code` IS NULL;

-- CreateIndex único para o código da carga química
CREATE UNIQUE INDEX `ChemicalShipment_code_key` ON `ChemicalShipment`(`code`);
