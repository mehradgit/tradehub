-- AlterTable
ALTER TABLE `message` ADD COLUMN `requestId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `BuyingRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
