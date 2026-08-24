/*
  Warnings:

  - A unique constraint covering the columns `[requestNumber]` on the table `BuyingRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productNumber]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requestNumber` to the `BuyingRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `BuyingRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productNumber` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `buyingrequest` ADD COLUMN `requestNumber` INTEGER NOT NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `productNumber` INTEGER NOT NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `profileNumber` INTEGER NOT NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `BuyingRequest_requestNumber_key` ON `BuyingRequest`(`requestNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_productNumber_key` ON `Product`(`productNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `User_profileNumber_key` ON `User`(`profileNumber`);
