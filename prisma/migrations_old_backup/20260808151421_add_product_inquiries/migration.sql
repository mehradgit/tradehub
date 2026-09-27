-- CreateTable
CREATE TABLE `ProductInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `quantity` INTEGER NULL,
    `requestedPrice` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductInquiry_productId_idx`(`productId`),
    INDEX `ProductInquiry_userId_idx`(`userId`),
    INDEX `ProductInquiry_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductInquiry` ADD CONSTRAINT `ProductInquiry_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductInquiry` ADD CONSTRAINT `ProductInquiry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductInquiry` ADD CONSTRAINT `ProductInquiry_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
