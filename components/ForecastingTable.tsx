'use client';

import React from 'react';
import { formatCurrency, formatNumber } from '@/lib/forecasting-calculations';
import { ClinicStatus } from '@/lib/clinics';

interface ForecastingTableProps {
  clinics: Array<{
    name: string;
    location: string;
  }>;
  clinicData: ClinicStatus[];
  dateRange: { start: string; end: string };
  variables: {
    nhsTestValue: number;
    nhsEligiblePercent: number;
    averageGos3Value: number;
    gos3EligiblePercent: number;
  };
  targetClinics: Record<string, number>; // clinic name -> target clinics
  targetTests: Record<string, number>; // clinic name -> target tests
  onTargetClinicsChange: (clinicName: string, value: number) => void;
  onTargetTestsChange: (clinicName: string, value: number) => void;
}

export function ForecastingTable({
  clinics,
  clinicData,
  dateRange,
  variables,
  targetClinics,
  targetTests,
  onTargetClinicsChange,
  onTargetTestsChange,
}: ForecastingTableProps) {
  // Parse shift date helper
  const parseShiftDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Calculate running clinics for a specific clinic
  const getRunningClinics = (clinicName: string): number => {
    const clinic = clinicData.find(c => c.clinic === clinicName);
    if (!clinic || !clinic.shifts || clinic.shifts.length === 0) return 0;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Count functioning shifts (properly staffed) within date range
    return clinic.shifts.filter(shift => {
      const shiftDate = parseShiftDate(shift.date);
      if (!shiftDate || shiftDate < startDate || shiftDate > endDate) return false;
      
      const roles = shift.jobRoles || [];
      const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
      const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
      
      return hasOptometrist && hasAssistant;
    }).length;
  };

  // Calculate GOS 1 (NHS) revenue for a clinic
  // Formula: Total Tests × NHS Eligible % × NHS Test Value
  const calculateGOS1 = (clinicName: string): number => {
    const clinics = targetClinics[clinicName] || 0;
    const tests = targetTests[clinicName] || 0;
    const totalTests = clinics * tests;
    return totalTests * (variables.nhsEligiblePercent / 100) * variables.nhsTestValue;
  };

  // Calculate GOS 3 revenue for a clinic
  // Formula: Target Clinics × Target Tests × GOS 3 Eligible % × Average GOS 3 Value
  const calculateGOS3 = (clinicName: string): number => {
    const clinics = targetClinics[clinicName] || 0;
    const tests = targetTests[clinicName] || 0;
    return clinics * tests * (variables.gos3EligiblePercent / 100) * variables.averageGos3Value;
  };

  // Calculate total GOS for a clinic
  const calculateTotalGOS = (clinicName: string): number => {
    return calculateGOS1(clinicName) + calculateGOS3(clinicName);
  };

  // Calculate totals
  const totals = {
    runningClinics: clinics.reduce((sum, clinic) => sum + getRunningClinics(clinic.name), 0),
    targetClinics: clinics.reduce((sum, clinic) => sum + (targetClinics[clinic.name] || 0), 0),
    targetTests: clinics.reduce((sum, clinic) => sum + (targetTests[clinic.name] || 0), 0),
    totalTests: clinics.reduce((sum, clinic) => {
      const clinicCount = targetClinics[clinic.name] || 0;
      const tests = targetTests[clinic.name] || 0;
      return sum + (clinicCount * tests);
    }, 0),
    gos1: clinics.reduce((sum, clinic) => sum + calculateGOS1(clinic.name), 0),
    gos3: clinics.reduce((sum, clinic) => sum + calculateGOS3(clinic.name), 0),
    totalGOS: clinics.reduce((sum, clinic) => sum + calculateTotalGOS(clinic.name), 0),
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                Clinic Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clinics Running
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Clinics
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Tests per Clinic
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Tests
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                GOS 1 Expected
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                GOS 3 Expected
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                Total GOS Expected
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clinics.map((clinic) => {
              const runningClinics = getRunningClinics(clinic.name);
              const clinicTargetClinics = targetClinics[clinic.name] || 0;
              const clinicTargetTests = targetTests[clinic.name] || 0;
              const totalTests = clinicTargetClinics * clinicTargetTests;
              const gos1 = calculateGOS1(clinic.name);
              const gos3 = calculateGOS3(clinic.name);
              const totalGOS = calculateTotalGOS(clinic.name);

              return (
                <tr key={clinic.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                    {clinic.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {runningClinics}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      value={clinicTargetClinics || ''}
                      onChange={(e) => onTargetClinicsChange(clinic.name, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[32px]"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      value={clinicTargetTests || ''}
                      onChange={(e) => onTargetTestsChange(clinic.name, parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[32px]"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {formatNumber(totalTests)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 bg-blue-50">
                    {formatCurrency(gos1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 bg-blue-50">
                    {formatCurrency(gos3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-gray-900 bg-blue-50">
                    {formatCurrency(totalGOS)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
                TOTALS
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totals.runningClinics}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totals.targetClinics}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {formatNumber(totals.targetTests)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {formatNumber(totals.totalTests)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-blue-100">
                {formatCurrency(totals.gos1)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-blue-100">
                {formatCurrency(totals.gos3)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-blue-100">
                {formatCurrency(totals.totalGOS)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
