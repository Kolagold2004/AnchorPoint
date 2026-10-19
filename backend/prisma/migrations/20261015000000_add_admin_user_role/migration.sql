-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPS', 'READ_ONLY');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'READ_ONLY';
