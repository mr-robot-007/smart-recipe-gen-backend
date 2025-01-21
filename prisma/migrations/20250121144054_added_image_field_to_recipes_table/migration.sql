/*
  Warnings:

  - You are about to drop the column `search` on the `User_Searches` table. All the data in the column will be lost.
  - Added the required column `recipe_id` to the `User_Searches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User_Searches" DROP COLUMN "search",
ADD COLUMN     "recipe_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "User_Searches" ADD CONSTRAINT "User_Searches_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
