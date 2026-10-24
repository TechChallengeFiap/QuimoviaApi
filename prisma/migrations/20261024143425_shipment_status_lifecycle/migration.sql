-- Etapa 1: Amplia o ENUM com a união dos valores legados e novos (impede falhas de consistência)
ALTER TABLE `ChemicalShipment` MODIFY COLUMN `status`
  ENUM('REGISTERED', 'ANALYZING', 'INSPECTION', 'APPROVED', 'REPROVED', 'BLOCKED', 'RELEASED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')
  NOT NULL DEFAULT 'REGISTERED';

-- Etapa 2: Migração semântica dos registros legados existentes
UPDATE `ChemicalShipment` SET `status` = 'REPROVED' WHERE `status` = 'BLOCKED';
UPDATE `ChemicalShipment` SET `status` = 'APPROVED' WHERE `status` = 'RELEASED';

-- Etapa 3: Restringe o ENUM estritamente aos 8 valores canônicos do edital
ALTER TABLE `ChemicalShipment` MODIFY COLUMN `status`
  ENUM('REGISTERED', 'ANALYZING', 'INSPECTION', 'APPROVED', 'REPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')
  NOT NULL DEFAULT 'REGISTERED';

-- Etapa 4: Adiciona índice de performance para buscas e filtros por status
CREATE INDEX `ChemicalShipment_status_idx` ON `ChemicalShipment`(`status`);
