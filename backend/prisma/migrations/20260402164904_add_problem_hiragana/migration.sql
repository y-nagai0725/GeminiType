/*
  Warnings:

  - Added the required column `problem_hiragana` to the `session_problems` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_session_problems" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "problem_text" TEXT NOT NULL,
    "problem_hiragana" TEXT NOT NULL,
    "romaji_text" TEXT NOT NULL,
    "kpm" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "miss_count" INTEGER NOT NULL,
    "missed_keys" TEXT NOT NULL,
    CONSTRAINT "session_problems_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "typing_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_session_problems" ("accuracy", "id", "kpm", "miss_count", "missed_keys", "problem_text", "romaji_text", "session_id") SELECT "accuracy", "id", "kpm", "miss_count", "missed_keys", "problem_text", "romaji_text", "session_id" FROM "session_problems";
DROP TABLE "session_problems";
ALTER TABLE "new_session_problems" RENAME TO "session_problems";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
