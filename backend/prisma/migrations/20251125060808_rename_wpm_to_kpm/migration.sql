/*
  Warnings:

  - You are about to drop the column `wpm` on the `session_problems` table. All the data in the column will be lost.
  - You are about to drop the column `average_wpm` on the `typing_sessions` table. All the data in the column will be lost.
  - Added the required column `kpm` to the `session_problems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `average_kpm` to the `typing_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_session_problems" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "problem_text" TEXT NOT NULL,
    "kpm" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "missed_keys" TEXT NOT NULL,
    CONSTRAINT "session_problems_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "typing_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_session_problems" ("accuracy", "id", "missed_keys", "problem_text", "session_id") SELECT "accuracy", "id", "missed_keys", "problem_text", "session_id" FROM "session_problems";
DROP TABLE "session_problems";
ALTER TABLE "new_session_problems" RENAME TO "session_problems";
CREATE TABLE "new_typing_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "session_type" TEXT NOT NULL,
    "genre_id" INTEGER,
    "gemini_prompt" TEXT,
    "average_kpm" REAL NOT NULL,
    "average_accuracy" REAL NOT NULL,
    "most_missed_key" TEXT NOT NULL,
    "total_types" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "typing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "typing_sessions_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_typing_sessions" ("average_accuracy", "created_at", "gemini_prompt", "genre_id", "id", "most_missed_key", "session_type", "total_types", "user_id") SELECT "average_accuracy", "created_at", "gemini_prompt", "genre_id", "id", "most_missed_key", "session_type", "total_types", "user_id" FROM "typing_sessions";
DROP TABLE "typing_sessions";
ALTER TABLE "new_typing_sessions" RENAME TO "typing_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
