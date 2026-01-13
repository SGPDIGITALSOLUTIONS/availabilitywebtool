'use client';

import React from 'react';
import { ClinicStatus, ShiftData } from '@/lib/clinics';
import { formatLastUpdated, getStatusColor, getStatusIcon } from '@/lib/utils';
import { MapPin, Eye } from 'lucide-react';

// Define the expected clinic data structure with computed status
interface ClinicWithStatus extends ClinicStatus {
  computedStatus?: 'operational' | 'limited' | 'non-functional' | 'error';
}

interface ClinicCardProps {
  clinicData: ClinicWithStatus;
  onClick: () => void;
}

export function ClinicCard({ clinicData, onClick }: ClinicCardProps) {
  const status = clinicData.computedStatus || 'error';
  const statusColorClass = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  // Calculate functioning shifts vs total shifts
  const totalShifts = clinicData.shifts?.length || 0;
  const functioningShifts = clinicData.shifts?.filter(shift => {
    const roles = shift.jobRoles || [];
    const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
    const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
    return hasOptometrist && hasAssistant;
  }).length || 0;

  // Calculate optometrists and assistants assigned vs required
  const requiredOptometrists = totalShifts; // 1 per shift
  const requiredAssistants = totalShifts; // 1 per shift
  
  let assignedOptometrists = 0;
  let assignedAssistants = 0;
  
  clinicData.shifts?.forEach(shift => {
    const roles = shift.jobRoles || [];
    // Count maximum 1 optometrist and 1 assistant per shift (surplus doesn't help other shifts)
    const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
    const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
    
    if (hasOptometrist) assignedOptometrists += 1;
    if (hasAssistant) assignedAssistants += 1;
  });

  const optometristsNeeded = Math.max(0, requiredOptometrists - assignedOptometrists);
  const assistantsNeeded = Math.max(0, requiredAssistants - assignedAssistants);

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02] md:hover:scale-105 min-h-[44px]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-500 flex-shrink-0" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{clinicData.clinic}</h3>
        </div>
        <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${statusColorClass} flex-shrink-0 ml-2`}>
          <span className="mr-1">{statusIcon}</span>
          <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      {/* Functioning Shifts Display */}
      <div className="text-center mb-3 md:mb-4">
        <div className="inline-block p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{functioningShifts}/{totalShifts}</div>
          <div className="text-xs md:text-sm font-medium text-gray-600">Clinics Running</div>
          <div className="text-xs text-gray-500 mt-1 hidden sm:block">(within date range)</div>
        </div>
      </div>

      {/* Staff Requirements */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="bg-blue-50 p-2 md:p-3 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-800">{optometristsNeeded}</div>
            <div className="text-xs md:text-sm font-medium text-blue-600">Optometrists</div>
            <div className="text-xs text-blue-500 hidden sm:block">needed</div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-2 md:p-3 rounded-lg border border-purple-200">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-purple-800">{assistantsNeeded}</div>
            <div className="text-xs md:text-sm font-medium text-purple-600">Assistants</div>
            <div className="text-xs text-purple-500 hidden sm:block">needed</div>
          </div>
        </div>
      </div>

      {/* Click to view indicator */}
      <div className="flex items-center justify-center py-2 mb-2 md:mb-3 bg-blue-50 rounded-lg border border-blue-200 min-h-[44px]">
        <Eye className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
        <span className="text-xs md:text-sm font-medium text-blue-700">Click to view schedule</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
        <span>Last updated: {formatLastUpdated(clinicData.lastUpdated)}</span>
        {clinicData.error && (
          <span className="text-red-500 font-medium">Error: {clinicData.error}</span>
        )}
      </div>
    </div>
  );
} 