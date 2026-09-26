-- CreateTable
CREATE TABLE `RevealedBuyerInfo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RevealedBuyerInfo_userId_idx`(`userId`),
    INDEX `RevealedBuyerInfo_requestId_idx`(`requestId`),
    UNIQUE INDEX `RevealedBuyerInfo_userId_requestId_key`(`userId`, `requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RevealedBuyerInfo` ADD CONSTRAINT `RevealedBuyerInfo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevealedBuyerInfo` ADD CONSTRAINT `RevealedBuyerInfo_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `BuyingRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
