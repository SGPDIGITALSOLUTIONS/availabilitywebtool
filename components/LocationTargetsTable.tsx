'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

export interface LocationTarget {
  location: string;
  targetClinics: number;
}

interface LocationTargetsTableProps {
  locations: string[];
  locationTargets: Record<string, LocationTarget>;
  onChange: (location: string, targetClinics: number) => void;
}

export function LocationTargetsTable({ 
  locations, 
  locationTargets, 
  onChange 
}: LocationTargetsTableProps) {
  const totalClinics = locations.reduce((sum, location) => {
    return sum + (locationTargets[location]?.targetClinics || 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Location Targets
        </h2>
        <div className="text-sm md:text-base text-gray-600">
          <span className="font-semibold">Total Clinics: </span>
          <span className="text-brand-azure font-bold text-lg md:text-xl">{totalClinics}</span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Clinics
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={location} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{location}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={locationTargets[location]?.targetClinics || ''}
                    onChange={(e) => onChange(location, parseInt(e.target.value) || 0)}
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
        {locations.map((location) => (
          <div key={location} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{location}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Target Clinics
              </label>
              <input
                type="number"
                min="0"
                value={locationTargets[location]?.targetClinics || ''}
                onChange={(e) => onChange(location, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
