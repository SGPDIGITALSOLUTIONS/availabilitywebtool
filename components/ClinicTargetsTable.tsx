'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Building2 } from 'lucide-react';

export interface ClinicTarget {
  clinicName: string;
  targetTests: number;
}

export interface LocationClinicTargets {
  location: string;
  clinics: ClinicTarget[];
}

interface ClinicTargetsTableProps {
  locationClinicTargets: LocationClinicTargets[];
  onChange: (location: string, clinicName: string, targetTests: number) => void;
}

export function ClinicTargetsTable({ locationClinicTargets, onChange }: ClinicTargetsTableProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const toggleLocation = (location: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(location)) {
      newExpanded.delete(location);
    } else {
      newExpanded.add(location);
    }
    setExpandedLocations(newExpanded);
  };

  const getLocationTotal = (location: string): number => {
    const locationData = locationClinicTargets.find(l => l.location === location);
    if (!locationData) return 0;
    return locationData.clinics.reduce((sum, clinic) => sum + (clinic.targetTests || 0), 0);
  };

  const getOverallTotal = (): number => {
    return locationClinicTargets.reduce((sum, locationData) => {
      return sum + locationData.clinics.reduce((locSum, clinic) => locSum + (clinic.targetTests || 0), 0);
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Clinic Targets
        </h2>
        <div className="text-sm md:text-base text-gray-600">
          <span className="font-semibold">Total Tests: </span>
          <span className="text-brand-azure font-bold text-lg md:text-xl">{getOverallTotal()}</span>
        </div>
      </div>

      <div className="space-y-2">
        {locationClinicTargets.map((locationData) => {
          const isExpanded = expandedLocations.has(locationData.location);
          const locationTotal = getLocationTotal(locationData.location);

          return (
            <div key={locationData.location} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Location Header */}
              <button
                onClick={() => toggleLocation(locationData.location)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <span className="text-base md:text-lg font-semibold text-gray-900">
                    {locationData.location}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({locationData.clinics.length} {locationData.clinics.length === 1 ? 'clinic' : 'clinics'})
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-brand-azure">
                    Total: {locationTotal} tests
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Clinic List */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clinic Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Target Tests
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {locationData.clinics.map((clinic) => (
                          <tr key={clinic.clinicName} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{clinic.clinicName}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                value={clinic.targetTests || ''}
                                onChange={(e) => onChange(locationData.location, clinic.clinicName, parseInt(e.target.value) || 0)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {locationData.clinics.map((clinic) => (
                      <div key={clinic.clinicName} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-900">{clinic.clinicName}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Target Tests
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={clinic.targetTests || ''}
                            onChange={(e) => onChange(locationData.location, clinic.clinicName, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
