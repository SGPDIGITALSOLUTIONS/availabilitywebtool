-- CreateTable
CREATE TABLE "forecast" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nhsTestValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nhsEligiblePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gos3EligiblePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageGos3Value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_location_target" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "targetClinics" INTEGER NOT NULL,

    CONSTRAINT "forecast_location_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_clinic_target" (
    "id" TEXT NOT NULL,
    "locationTargetId" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "targetTests" INTEGER NOT NULL,

    CONSTRAINT "forecast_clinic_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forecast_createdAt_idx" ON "forecast"("createdAt");

-- CreateIndex
CREATE INDEX "forecast_location_target_forecastId_idx" ON "forecast_location_target"("forecastId");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_location_target_forecastId_location_key" ON "forecast_location_target"("forecastId", "location");

-- CreateIndex
CREATE INDEX "forecast_clinic_target_locationTargetId_idx" ON "forecast_clinic_target"("locationTargetId");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_clinic_target_locationTargetId_clinicName_key" ON "forecast_clinic_target"("locationTargetId", "clinicName");

-- AddForeignKey
ALTER TABLE "forecast_location_target" ADD CONSTRAINT "forecast_location_target_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_clinic_target" ADD CONSTRAINT "forecast_clinic_target_locationTargetId_fkey" FOREIGN KEY ("locationTargetId") REFERENCES "forecast_location_target"("id") ON DELETE CASCADE ON UPDATE CASCADE;
