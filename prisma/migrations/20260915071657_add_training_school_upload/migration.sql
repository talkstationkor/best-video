-- CreateTable
CREATE TABLE "TrainingSchoolUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOAD_REQUIRED',
    "trainingSchoolUrl" TEXT,
    "uploadedById" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSchoolUpload_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrainingSchoolUpload_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProjectVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrainingSchoolUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "assignedEditorId" TEXT,
    "finalVersionId" TEXT,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_assignedEditorId_fkey" FOREIGN KEY ("assignedEditorId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_finalVersionId_fkey" FOREIGN KEY ("finalVersionId") REFERENCES "ProjectVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("approvedAt", "approvedById", "assignedEditorId", "createdAt", "createdById", "currentVersion", "details", "id", "projectName", "status", "team", "updatedAt", "workflowStatus") SELECT "approvedAt", "approvedById", "assignedEditorId", "createdAt", "createdById", "currentVersion", "details", "id", "projectName", "status", "team", "updatedAt", "workflowStatus" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_finalVersionId_key" ON "Project"("finalVersionId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_team_idx" ON "Project"("team");
CREATE INDEX "Project_assignedEditorId_idx" ON "Project"("assignedEditorId");
CREATE INDEX "Project_finalVersionId_idx" ON "Project"("finalVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TrainingSchoolUpload_projectId_idx" ON "TrainingSchoolUpload"("projectId");

-- CreateIndex
CREATE INDEX "TrainingSchoolUpload_versionId_idx" ON "TrainingSchoolUpload"("versionId");

-- CreateIndex
CREATE INDEX "TrainingSchoolUpload_status_idx" ON "TrainingSchoolUpload"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSchoolUpload_projectId_versionId_key" ON "TrainingSchoolUpload"("projectId", "versionId");
