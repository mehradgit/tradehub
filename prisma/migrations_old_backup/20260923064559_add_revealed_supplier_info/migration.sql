-- CreateTable
CREATE TABLE `RevealedSupplierInfo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RevealedSupplierInfo_userId_idx`(`userId`),
    INDEX `RevealedSupplierInfo_productId_idx`(`productId`),
    UNIQUE INDEX `RevealedSupplierInfo_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RevealedSupplierInfo` ADD CONSTRAINT `RevealedSupplierInfo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevealedSupplierInfo` ADD CONSTRAINT `RevealedSupplierInfo_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
