/*
  Warnings:

  - Added the required column `problem_hiragana` to the `problems` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_problems" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "genre_id" INTEGER NOT NULL,
    "problem_text" TEXT NOT NULL,
    "problem_hiragana" TEXT NOT NULL,
    CONSTRAINT "problems_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_problems" ("genre_id", "id", "problem_text") SELECT "genre_id", "id", "problem_text" FROM "problems";
DROP TABLE "problems";
ALTER TABLE "new_problems" RENAME TO "problems";
CREATE UNIQUE INDEX "problems_genre_id_problem_text_key" ON "problems"("genre_id", "problem_text");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
