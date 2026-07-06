CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ReportSource" AS ENUM ('PDF', 'MANUAL', 'DEMO');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEWED', 'FINALIZED', 'FAILED');
CREATE TYPE "LabFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'BORDERLINE', 'CONCERNING', 'UNKNOWN');
CREATE TYPE "AuditAction" AS ENUM (
  'REGISTER',
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'UPLOAD_CREATED',
  'REPORT_CREATED',
  'REPORT_UPDATED',
  'REPORT_DELETED',
  'EXPORT_CREATED',
  'SETTINGS_CHANGED',
  'DATA_DELETED',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_COMPLETE',
  'TWO_FACTOR_ENABLED',
  'TWO_FACTOR_DISABLED',
  'PASSKEY_REGISTERED'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "twoFactorSecret" TEXT,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "passkeyEnabled" BOOLEAN NOT NULL DEFAULT false,
  "recoveryTokenHash" TEXT,
  "recoveryTokenExpiry" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'system',
  "storeRawPdfs" BOOLEAN NOT NULL DEFAULT false,
  "turnstileEnabled" BOOLEAN NOT NULL DEFAULT false,
  "localAiPreferred" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Passkey" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "publicKey" BYTEA NOT NULL,
  "counter" BIGINT NOT NULL DEFAULT 0,
  "deviceType" TEXT,
  "backedUp" BOOLEAN NOT NULL DEFAULT false,
  "transports" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "ReportSource" NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
  "reportDate" TIMESTAMP(3) NOT NULL,
  "labName" TEXT,
  "originalFileName" TEXT,
  "storedFilePath" TEXT,
  "extractedTextHash" TEXT,
  "parserWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "summaryJson" JSONB,
  "recommendationsJson" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabResult" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "testName" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Other',
  "value" DECIMAL(12,4),
  "stringValue" TEXT,
  "unit" TEXT,
  "referenceLow" DECIMAL(12,4),
  "referenceHigh" DECIMAL(12,4),
  "referenceRangeRaw" TEXT,
  "flag" "LabFlag" NOT NULL DEFAULT 'UNKNOWN',
  "notes" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" "AuditAction" NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "Passkey"("credentialId");
CREATE INDEX "Passkey_userId_idx" ON "Passkey"("userId");
CREATE INDEX "HealthReport_userId_reportDate_idx" ON "HealthReport"("userId", "reportDate");
CREATE INDEX "HealthReport_status_idx" ON "HealthReport"("status");
CREATE INDEX "LabResult_reportId_idx" ON "LabResult"("reportId");
CREATE INDEX "LabResult_testName_idx" ON "LabResult"("testName");
CREATE INDEX "LabResult_category_idx" ON "LabResult"("category");
CREATE INDEX "LabResult_flag_idx" ON "LabResult"("flag");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthReport" ADD CONSTRAINT "HealthReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "HealthReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
