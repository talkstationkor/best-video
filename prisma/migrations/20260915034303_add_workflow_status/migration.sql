-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectName" TEXT NOT NULL,
    "details" TEXT,
    "team" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "workflowStatus" TEXT NOT NULL DEFAULT 'EDITOR_WORKING',
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("approvedAt", "approvedById", "createdAt", "createdById", "currentVersion", "details", "id", "projectName", "status", "team", "updatedAt") SELECT "approvedAt", "approvedById", "createdAt", "createdById", "currentVersion", "details", "id", "projectName", "status", "team", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_team_idx" ON "Project"("team");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
