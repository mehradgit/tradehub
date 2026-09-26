-- AlterTable
ALTER TABLE `buyingrequest` ADD COLUMN `isPriceNegotiable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `paymentTerms` VARCHAR(191) NULL,
    ADD COLUMN `supplierCountries` JSON NULL,
    ADD COLUMN `targetPrice` DOUBLE NULL;
