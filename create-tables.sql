-- CMC IT SYSTEM SUPPORT Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Drop existing types if they exist
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ComplaintStatus" CASCADE;
DROP TYPE IF EXISTS "Department" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'WORKER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Department" AS ENUM (
  'HR_MAIN', 'HR_MANAGER', 'WPO_MAIN', 'WPO_MANAGER',
  'SHIPPING_MAIN', 'SHIPPING_MANAGER', 'CASH_OFFICE',
  'ACCOUNTS', 'SALES', 'AUDIT', 'E_COLLECTION',
  'TRANSPORT', 'TRADING_ROOM', 'MARKETING', 'RISK',
  'LBC', 'PROCUREMENT'
);

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable: admins
CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable: workers
CREATE TABLE IF NOT EXISTS "workers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "department" "Department",
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: complaints
CREATE TABLE IF NOT EXISTS "complaints" (
    "id" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "images" TEXT[],
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tickets
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "workerId" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'ASSIGNED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ticket_updates
CREATE TABLE IF NOT EXISTS "ticket_updates" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "complaintId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_key" ON "admins"("email");
CREATE INDEX IF NOT EXISTS "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "workers_email_key" ON "workers"("email");
CREATE INDEX IF NOT EXISTS "workers_email_idx" ON "workers"("email");
CREATE INDEX IF NOT EXISTS "workers_department_idx" ON "workers"("department");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "complaints_status_idx" ON "complaints"("status");
CREATE INDEX IF NOT EXISTS "complaints_department_idx" ON "complaints"("department");
CREATE INDEX IF NOT EXISTS "complaints_createdAt_idx" ON "complaints"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_ticketNumber_key" ON "tickets"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_complaintId_key" ON "tickets"("complaintId");
CREATE INDEX IF NOT EXISTS "tickets_ticketNumber_idx" ON "tickets"("ticketNumber");
CREATE INDEX IF NOT EXISTS "tickets_workerId_idx" ON "tickets"("workerId");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ticket_updates_ticketId_idx" ON "ticket_updates"("ticketId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_complaintId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_complaintId_fkey"
    FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_adminId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_workerId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_updates" DROP CONSTRAINT IF EXISTS "ticket_updates_ticketId_fkey";
ALTER TABLE "ticket_updates" ADD CONSTRAINT "ticket_updates_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger for auto-updating updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
    CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
    CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
    CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
    CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;
