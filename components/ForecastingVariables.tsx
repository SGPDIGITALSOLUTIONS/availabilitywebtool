'use client';

import React from 'react';
import { PoundSterling, Percent } from 'lucide-react';

export interface ForecastingVariables {
  nhsTestValue: number;
  nhsEligiblePercent: number;
  averageGos3Value: number;
  gos3EligiblePercent: number;
}

interface ForecastingVariablesProps {
  variables: ForecastingVariables;
  onChange: (variables: ForecastingVariables) => void;
}

export function ForecastingVariables({ variables, onChange }: ForecastingVariablesProps) {
  const handleChange = (field: keyof ForecastingVariables, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...variables,
      [field]: numValue,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
        Forecasting Variables
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* NHS Test Value */}
        <div>
          <label htmlFor="nhsTestValue" className="block text-sm font-medium text-gray-700 mb-2">
            NHS Test Value
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PoundSterling className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="nhsTestValue"
              min="0"
              step="0.01"
              value={variables.nhsTestValue || ''}
              onChange={(e) => handleChange('nhsTestValue', e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md text-base md:text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* NHS Eligible % */}
        <div>
          <label htmlFor="nhsEligiblePercent" className="block text-sm font-medium text-gray-700 mb-2">
            NHS Eligible %
          </label>
          <div className="relative">
            <input
              type="number"
              id="nhsEligiblePercent"
              min="0"
              max="100"
              step="0.1"
              value={variables.nhsEligiblePercent || ''}
              onChange={(e) => handleChange('nhsEligiblePercent', e.target.value)}
              className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-md text-base md:text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Percent className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Average GOS 3 Value */}
        <div>
          <label htmlFor="averageGos3Value" className="block text-sm font-medium text-gray-700 mb-2">
            Average GOS 3 Value
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PoundSterling className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="averageGos3Value"
              min="0"
              step="0.01"
              value={variables.averageGos3Value || ''}
              onChange={(e) => handleChange('averageGos3Value', e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md text-base md:text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* GOS 3 Eligible % */}
        <div>
          <label htmlFor="gos3EligiblePercent" className="block text-sm font-medium text-gray-700 mb-2">
            GOS 3 Eligible %
          </label>
          <div className="relative">
            <input
              type="number"
              id="gos3EligiblePercent"
              min="0"
              max="100"
              step="0.1"
              value={variables.gos3EligiblePercent || ''}
              onChange={(e) => handleChange('gos3EligiblePercent', e.target.value)}
              className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-md text-base md:text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Percent className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
