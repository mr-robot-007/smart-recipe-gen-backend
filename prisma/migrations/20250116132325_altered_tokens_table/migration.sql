/*
  Warnings:

  - You are about to drop the column `user_id` on the `Tokens` table. All the data in the column will be lost.
  - Added the required column `token` to the `Tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tokens" DROP CONSTRAINT "Tokens_user_id_fkey";

-- AlterTable
ALTER TABLE "Tokens" DROP COLUMN "user_id",
ADD COLUMN     "token" TEXT NOT NULL;
