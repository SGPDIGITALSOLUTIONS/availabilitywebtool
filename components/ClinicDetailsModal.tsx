'use client';

import React from 'react';
import { ClinicStatus, ShiftData } from '@/lib/clinics';
import { formatLastUpdated, getStatusColor, getStatusIcon } from '@/lib/utils';
import { X, Calendar, Users, MapPin } from 'lucide-react';

// Define the expected clinic data structure with computed status
interface ClinicWithStatus extends ClinicStatus {
  computedStatus?: 'operational' | 'limited' | 'non-functional' | 'error';
}

interface ClinicDetailsModalProps {
  clinic: ClinicWithStatus;
  isOpen: boolean;
  onClose: () => void;
}

export function ClinicDetailsModal({ clinic, isOpen, onClose }: ClinicDetailsModalProps) {
  if (!isOpen) return null;

  const status = clinic.computedStatus || 'error';
  const statusColorClass = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-gray-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{clinic.clinic}</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColorClass} mt-2`}>
                <span className="mr-1">{statusIcon}</span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Future Shift Dates</h3>
            </div>
            
            {clinic.shifts && clinic.shifts.length > 0 ? (
              <div className="space-y-3">
                {clinic.shifts.map((shift, index) => {
                  // Check if shift has required staffing (1 optometrist + 1 assistant)
                  const roles = shift.jobRoles || [];
                  const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
                  const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
                  const isFullyStaffed = hasOptometrist && hasAssistant;
                  
                  // Use red styling for understaffed shifts, blue for fully staffed
                  const containerClass = isFullyStaffed 
                    ? "flex items-center justify-between p-3 rounded border bg-blue-50 border-blue-200"
                    : "flex items-center justify-between p-3 rounded border bg-red-50 border-red-200";
                  
                  const iconClass = isFullyStaffed ? "h-4 w-4 text-blue-500" : "h-4 w-4 text-red-500";
                  const dateClass = isFullyStaffed ? "font-medium text-blue-900" : "font-medium text-red-900";
                  const separatorClass = isFullyStaffed ? "text-blue-600" : "text-red-600";
                  const timeClass = isFullyStaffed ? "text-blue-700" : "text-red-700";
                  const badgeClass = isFullyStaffed ? "px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800" : "px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800";
                  
                  return (
                    <div 
                      key={index} 
                      className={containerClass}
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className={iconClass} />
                        <span className={dateClass}>{shift.date}</span>
                        {shift.time && (
                          <>
                            <span className={separatorClass}>•</span>
                            <span className={timeClass}>{shift.time}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {shift.jobRoles && shift.jobRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {[...shift.jobRoles].sort((a, b) => b.localeCompare(a)).map((role, roleIndex) => (
                              <span 
                                key={roleIndex}
                                className={badgeClass}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No shift dates found</p>
                <p className="text-sm mt-2">
                  {clinic.error ? `Error: ${clinic.error}` : 'No shifts were scraped from this clinic'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Last updated: {formatLastUpdated(clinic.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 