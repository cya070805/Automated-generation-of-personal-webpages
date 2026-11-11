-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "baseId" TEXT NOT NULL DEFAULT 'paper',
    "recipeMap" JSONB,
    "theme" JSONB,
    "layout" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pages_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pages" ("createdAt", "id", "layout", "resumeId", "theme", "updatedAt") SELECT "createdAt", "id", "layout", "resumeId", "theme", "updatedAt" FROM "pages";
DROP TABLE "pages";
ALTER TABLE "new_pages" RENAME TO "pages";
CREATE INDEX "pages_resumeId_idx" ON "pages"("resumeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
