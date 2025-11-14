-- CMC IT SYSTEM SUPPORT Database Schema (MySQL)
-- Run this in your MySQL database

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS `ticketUpdates`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `workers`;
DROP TABLE IF EXISTS `admins`;

-- CreateTable: admins
CREATE TABLE `admins` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(50),
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `admins_email_key` (`email`),
    INDEX `admins_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: workers
CREATE TABLE `workers` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(50),
    `department` ENUM(
        'HR_MAIN', 'HR_MANAGER', 'WPO_MAIN', 'WPO_MANAGER',
        'SHIPPING_MAIN', 'SHIPPING_MANAGER', 'CASH_OFFICE',
        'ACCOUNTS', 'SALES', 'AUDIT', 'E_COLLECTION',
        'TRANSPORT', 'TRADING_ROOM', 'MARKETING', 'RISK',
        'LBC', 'PROCUREMENT'
    ),
    `specialization` TEXT,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `workers_email_key` (`email`),
    INDEX `workers_email_idx` (`email`),
    INDEX `workers_department_idx` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: complaints
CREATE TABLE `complaints` (
    `id` VARCHAR(36) NOT NULL,
    `staffName` VARCHAR(255) NOT NULL,
    `department` ENUM(
        'HR_MAIN', 'HR_MANAGER', 'WPO_MAIN', 'WPO_MANAGER',
        'SHIPPING_MAIN', 'SHIPPING_MANAGER', 'CASH_OFFICE',
        'ACCOUNTS', 'SALES', 'AUDIT', 'E_COLLECTION',
        'TRANSPORT', 'TRADING_ROOM', 'MARKETING', 'RISK',
        'LBC', 'PROCUREMENT'
    ) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT,
    `location` VARCHAR(255),
    `images` JSON,
    `status` ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `complaints_status_idx` (`status`),
    INDEX `complaints_department_idx` (`department`),
    INDEX `complaints_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: tickets
CREATE TABLE `tickets` (
    `id` VARCHAR(36) NOT NULL,
    `ticketNumber` VARCHAR(50) NOT NULL,
    `complaintId` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `workerId` VARCHAR(36),
    `status` ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'ASSIGNED',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `notes` TEXT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `tickets_ticketNumber_key` (`ticketNumber`),
    UNIQUE INDEX `tickets_complaintId_key` (`complaintId`),
    INDEX `tickets_ticketNumber_idx` (`ticketNumber`),
    INDEX `tickets_workerId_idx` (`workerId`),
    INDEX `tickets_status_idx` (`status`),

    CONSTRAINT `tickets_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `tickets_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `tickets_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `workers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: ticketUpdates
CREATE TABLE `ticketUpdates` (
    `id` VARCHAR(36) NOT NULL,
    `ticketId` VARCHAR(36) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `ticketUpdates_ticketId_idx` (`ticketId`),

    CONSTRAINT `ticketUpdates_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: notifications
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `complaintId` VARCHAR(36),
    `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `notifications_isRead_idx` (`isRead`),
    INDEX `notifications_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
