CREATE TABLE "PersonProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "profileAge" INTEGER,
  "profileGender" TEXT,
  "profileCountry" TEXT,
  "profileEthnicity" TEXT,
  "profileJob" TEXT,
  "profileHobbies" TEXT,
  "profileRoutine" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PersonProfile" (
  "id",
  "userId",
  "name",
  "isDefault",
  "profileAge",
  "profileGender",
  "profileCountry",
  "profileEthnicity",
  "profileJob",
  "profileHobbies",
  "profileRoutine",
  "createdAt",
  "updatedAt"
)
SELECT
  'person_' || md5("User"."id" || CURRENT_TIMESTAMP::TEXT),
  "User"."id",
  COALESCE(NULLIF("User"."name", ''), 'Me'),
  true,
  "UserSettings"."profileAge",
  "UserSettings"."profileGender",
  "UserSettings"."profileCountry",
  "UserSettings"."profileEthnicity",
  "UserSettings"."profileJob",
  "UserSettings"."profileHobbies",
  "UserSettings"."profileRoutine",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
LEFT JOIN "UserSettings" ON "UserSettings"."userId" = "User"."id";

ALTER TABLE "HealthReport" ADD COLUMN "personId" TEXT;
ALTER TABLE "ActionPlanItem" ADD COLUMN "personId" TEXT;

UPDATE "HealthReport"
SET "personId" = "PersonProfile"."id"
FROM "PersonProfile"
WHERE "HealthReport"."userId" = "PersonProfile"."userId"
  AND "PersonProfile"."isDefault" = true;

UPDATE "ActionPlanItem"
SET "personId" = "HealthReport"."personId"
FROM "HealthReport"
WHERE "ActionPlanItem"."reportId" = "HealthReport"."id";

UPDATE "ActionPlanItem"
SET "personId" = "PersonProfile"."id"
FROM "PersonProfile"
WHERE "ActionPlanItem"."personId" IS NULL
  AND "ActionPlanItem"."userId" = "PersonProfile"."userId"
  AND "PersonProfile"."isDefault" = true;

ALTER TABLE "HealthReport" ALTER COLUMN "personId" SET NOT NULL;
ALTER TABLE "ActionPlanItem" ALTER COLUMN "personId" SET NOT NULL;

CREATE INDEX "PersonProfile_userId_idx" ON "PersonProfile"("userId");
CREATE INDEX "PersonProfile_userId_isDefault_idx" ON "PersonProfile"("userId", "isDefault");
CREATE INDEX "HealthReport_userId_personId_reportDate_idx" ON "HealthReport"("userId", "personId", "reportDate");
CREATE INDEX "HealthReport_personId_idx" ON "HealthReport"("personId");
CREATE INDEX "ActionPlanItem_personId_status_idx" ON "ActionPlanItem"("personId", "status");

ALTER TABLE "PersonProfile" ADD CONSTRAINT "PersonProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthReport" ADD CONSTRAINT "HealthReport_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
