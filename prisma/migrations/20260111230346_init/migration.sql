-- CreateTable
CREATE TABLE "clinic_cache" (
    "id" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "shifts" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,

    CONSTRAINT "clinic_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_job" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "clinicsScraped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "scrape_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_cache_clinicName_key" ON "clinic_cache"("clinicName");

-- CreateIndex
CREATE INDEX "clinic_cache_lastUpdated_idx" ON "clinic_cache"("lastUpdated");

-- CreateIndex
CREATE INDEX "clinic_cache_clinicName_idx" ON "clinic_cache"("clinicName");

-- CreateIndex
CREATE INDEX "scrape_job_startedAt_idx" ON "scrape_job"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_username_idx" ON "user"("username");
