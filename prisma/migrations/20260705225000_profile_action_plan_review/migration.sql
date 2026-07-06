ALTER TYPE "AuditAction" ADD VALUE 'ACTION_PLAN_CHANGED';

ALTER TABLE "UserSettings"
  ADD COLUMN "profileCountry" TEXT,
  ADD COLUMN "profileEthnicity" TEXT,
  ADD COLUMN "profileJob" TEXT,
  ADD COLUMN "profileHobbies" TEXT,
  ADD COLUMN "profileRoutine" TEXT;

CREATE TABLE "ActionPlanItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reportId" TEXT,
  "category" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionPlanItem_userId_status_idx" ON "ActionPlanItem"("userId", "status");
CREATE INDEX "ActionPlanItem_reportId_idx" ON "ActionPlanItem"("reportId");

ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "HealthReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
