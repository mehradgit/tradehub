-- AlterTable
ALTER TABLE `buyingrequest` ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;
