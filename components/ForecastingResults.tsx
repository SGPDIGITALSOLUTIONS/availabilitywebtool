'use client';

import React from 'react';
import { Activity, Building2, PoundSterling, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/forecasting-calculations';

interface ForecastingResultsProps {
  totalTests: number;
  totalClinics: number;
  expectedGOS: number;
  runningClinicsCount?: number;
  loadingClinics?: boolean;
}

export function ForecastingResults({ 
  totalTests, 
  totalClinics, 
  expectedGOS,
  runningClinicsCount,
  loadingClinics = false
}: ForecastingResultsProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Total Tests */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">Total Tests</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 truncate">
                {formatNumber(totalTests)}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Activity className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Total Clinics Run */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">Total Clinics Run</p>
              <p className="text-2xl md:text-3xl font-bold text-brand-azure truncate">
                {formatNumber(totalClinics)}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Building2 className="h-8 w-8 md:h-10 md:w-10 text-brand-azure" />
            </div>
          </div>
        </div>

        {/* Expected GOS */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">Expected GOS</p>
              <p className="text-2xl md:text-3xl font-bold text-brand-turquoise truncate">
                {formatCurrency(expectedGOS)}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <PoundSterling className="h-8 w-8 md:h-10 md:w-10 text-brand-turquoise" />
            </div>
          </div>
        </div>
      </div>

      {/* Running Clinics Info */}
      {runningClinicsCount !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {loadingClinics ? (
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              )}
              <div>
                <p className="text-sm md:text-base font-medium text-blue-900">
                  Clinics Currently Running
                </p>
                <p className="text-xs md:text-sm text-blue-700 mt-1">
                  {loadingClinics 
                    ? 'Loading clinic data...' 
                    : `${runningClinicsCount} ${runningClinicsCount === 1 ? 'clinic is' : 'clinics are'} running within the selected date range`}
                </p>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-800">
              {loadingClinics ? '...' : runningClinicsCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
