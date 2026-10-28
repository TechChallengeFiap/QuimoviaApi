-- Mantém os identificadores e o índice; a existência do usuário é validada
-- pela API pública de Identidade e Acesso, sem FK entre bounded contexts.
ALTER TABLE `CargoDocument` DROP FOREIGN KEY `CargoDocument_responsibleUserId_fkey`;
