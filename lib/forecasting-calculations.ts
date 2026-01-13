/**
 * Forecasting calculation utilities
 */

export interface ForecastingVariables {
  nhsTestValue: number;
  nhsEligiblePercent: number; // 0-100
  averageGos3Value: number;
  gos3EligiblePercent: number; // 0-100
}

export interface ClinicTarget {
  clinicName: string;
  targetTests: number;
}

export interface LocationTarget {
  location: string;
  targetClinics: number;
  clinicTargets?: ClinicTarget[];
}

/**
 * Calculate Expected GOS revenue
 * Formula: (Total Tests × NHS Eligible % × NHS Test Value) + (Total Tests × GOS 3 Eligible % × Average GOS 3 Value)
 */
export function calculateExpectedGOS(
  totalTests: number,
  variables: ForecastingVariables
): number {
  const nhsRevenue = totalTests * (variables.nhsEligiblePercent / 100) * variables.nhsTestValue;
  const gos3Revenue = totalTests * (variables.gos3EligiblePercent / 100) * variables.averageGos3Value;
  return nhsRevenue + gos3Revenue;
}

/**
 * Calculate total tests from all clinic targets
 */
export function calculateTotalTests(locationTargets: LocationTarget[]): number {
  return locationTargets.reduce((total, locationTarget) => {
    const locationTests = (locationTarget.clinicTargets || []).reduce((sum, clinic) => {
      return sum + (clinic.targetTests || 0);
    }, 0);
    return total + locationTests;
  }, 0);
}

/**
 * Calculate total clinics run from all location targets
 */
export function calculateTotalClinics(locationTargets: LocationTarget[]): number {
  return locationTargets.reduce((total, locationTarget) => {
    return total + (locationTarget.targetClinics || 0);
  }, 0);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}
