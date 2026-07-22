-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('USER', 'MANAGER', 'SUPERADMIN') NOT NULL DEFAULT 'USER',
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `avatarUrl` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Venue` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mainImage` VARCHAR(191) NOT NULL,
    `images` JSON NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `workingHours` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `averageCheck` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `views` INTEGER NOT NULL DEFAULT 0,
    `type` ENUM('BAR', 'RESTAURANT', 'PUB', 'CAFE', 'CLUB') NOT NULL DEFAULT 'BAR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` TEXT NULL,
    `hasWifi` BOOLEAN NOT NULL DEFAULT false,
    `hasParking` BOOLEAN NOT NULL DEFAULT false,
    `hasMusic` BOOLEAN NOT NULL DEFAULT false,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,
    `rating` DOUBLE NOT NULL DEFAULT 0.0,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `text` TEXT NOT NULL,
    `receipt` VARCHAR(191) NULL,
    `isComplaint` BOOLEAN NOT NULL DEFAULT false,
    `complaintReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Favorite_userId_venueId_key`(`userId`, `venueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PasswordResetToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VenueView` (
    `id` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,
    `userIp` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TopCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meetup` (
    `id` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `contactInfo` VARCHAR(191) NOT NULL,
    `gender` ENUM('ANY', 'MALE', 'FEMALE') NOT NULL DEFAULT 'ANY',
    `companySize` INTEGER NOT NULL,
    `whoPays` ENUM('EACH_OWN', 'I_PAY', 'YOU_PAY') NOT NULL DEFAULT 'EACH_OWN',
    `budget` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isPromoted` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(191) NULL,
    `category` ENUM('GENERAL', 'PROMOTION', 'EVENT') NOT NULL DEFAULT 'GENERAL',
    `venueId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemText` (
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VenueMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('COMPLAINT', 'QUESTION') NOT NULL DEFAULT 'QUESTION',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `venueId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategoryOnVenues` (
    `categoryId` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`categoryId`, `venueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_VenueTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_VenueTags_AB_unique`(`A`, `B`),
    INDEX `_VenueTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_VenueTopCategories` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_VenueTopCategories_AB_unique`(`A`, `B`),
    INDEX `_VenueTopCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venue` ADD CONSTRAINT `Venue_manager_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venue` ADD CONSTRAINT `Venue_user_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VenueView` ADD CONSTRAINT `VenueView_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meetup` ADD CONSTRAINT `Meetup_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meetup` ADD CONSTRAINT `Meetup_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VenueMessage` ADD CONSTRAINT `VenueMessage_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryOnVenues` ADD CONSTRAINT `CategoryOnVenues_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryOnVenues` ADD CONSTRAINT `CategoryOnVenues_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `Venue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_VenueTags` ADD CONSTRAINT `_VenueTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_VenueTags` ADD CONSTRAINT `_VenueTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_VenueTopCategories` ADD CONSTRAINT `_VenueTopCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `TopCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_VenueTopCategories` ADD CONSTRAINT `_VenueTopCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `Venue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
