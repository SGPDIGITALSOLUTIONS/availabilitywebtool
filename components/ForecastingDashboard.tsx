'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getAllClinics, ClinicStatus } from '@/lib/clinics';
import { ForecastingVariables } from './ForecastingVariables';
import { ForecastingTable } from './ForecastingTable';
import { 
  type ForecastingVariables as ForecastingVariablesType 
} from '@/lib/forecasting-calculations';
import { Save } from 'lucide-react';
import { SaveForecastModal } from './SaveForecastModal';
import { SavedForecastsList, type SavedForecast } from './SavedForecastsList';

export function ForecastingDashboard() {
  // Get all clinics
  const allClinics = getAllClinics();

  // Calculate default date range (4 weeks from today)
  const getDefaultDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 28); // 4 weeks (28 days) from today
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [variables, setVariables] = useState<ForecastingVariablesType>({
    nhsTestValue: 0,
    nhsEligiblePercent: 0,
    averageGos3Value: 0,
    gos3EligiblePercent: 0,
  });
  const [clinicData, setClinicData] = useState<ClinicStatus[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedForecasts, setSavedForecasts] = useState<SavedForecast[]>([]);
  const [loadingForecasts, setLoadingForecasts] = useState(false);

  // Target clinics per clinic (not per location)
  const [targetClinics, setTargetClinics] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    allClinics.forEach(clinic => {
      initial[clinic.name] = 0;
    });
    return initial;
  });

  // Target tests per clinic
  const [targetTests, setTargetTests] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    allClinics.forEach(clinic => {
      initial[clinic.name] = 0;
    });
    return initial;
  });

  // Handle target clinics change
  const handleTargetClinicsChange = useCallback((clinicName: string, value: number) => {
    setTargetClinics(prev => ({
      ...prev,
      [clinicName]: value,
    }));
  }, []);

  // Handle target tests change
  const handleTargetTestsChange = useCallback((clinicName: string, value: number) => {
    setTargetTests(prev => ({
      ...prev,
      [clinicName]: value,
    }));
  }, []);

  // Fetch clinic data when date range changes
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!dateRange.start || !dateRange.end) return;
      
      setLoadingClinics(true);
      try {
        const response = await fetch(
          `/api/clinics?startDate=${dateRange.start}&endDate=${dateRange.end}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch clinic data');
        }
        
        const data = await response.json();
        setClinicData(data.clinics || []);
      } catch (error) {
        console.error('Error fetching clinic data:', error);
        setClinicData([]);
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinicData();
  }, [dateRange.start, dateRange.end]);

  // Load saved forecasts
  useEffect(() => {
    const loadForecasts = async () => {
      setLoadingForecasts(true);
      try {
        const response = await fetch('/api/forecasting/load');
        if (response.ok) {
          const data = await response.json();
          setSavedForecasts(data.forecasts || []);
        }
      } catch (error) {
        console.error('Error loading forecasts:', error);
      } finally {
        setLoadingForecasts(false);
      }
    };

    loadForecasts();
  }, []);

  // Save forecast
  const handleSave = async (forecastName: string) => {
    const response = await fetch('/api/forecasting/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: forecastName,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        variables,
        targetClinics,
        targetTests,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Failed to save forecast';
      console.error('Save failed:', errorMessage, errorData);
      throw new Error(errorMessage);
    }

    // Reload forecasts list
    const loadResponse = await fetch('/api/forecasting/load');
    if (loadResponse.ok) {
      const data = await loadResponse.json();
      setSavedForecasts(data.forecasts || []);
    }
  };

  // Load a saved forecast
  const handleLoadForecast = async (forecastId: string) => {
    try {
      const response = await fetch(`/api/forecasting/load?id=${forecastId}`);
      if (!response.ok) {
        throw new Error('Failed to load forecast');
      }

      const data = await response.json();
      const forecast = data.forecast;

      // Populate the form with saved data
      setDateRange({
        start: forecast.dateRangeStart,
        end: forecast.dateRangeEnd,
      });
      setVariables(forecast.variables);
      
      // Populate target clinics and tests
      const newTargetClinics: Record<string, number> = {};
      const newTargetTests: Record<string, number> = {};
      
      forecast.clinicTargets?.forEach((ct: any) => {
        newTargetClinics[ct.clinicName] = ct.targetClinics || 0;
        newTargetTests[ct.clinicName] = ct.targetTests || 0;
      });
      
      setTargetClinics(newTargetClinics);
      setTargetTests(newTargetTests);
    } catch (error) {
      console.error('Error loading forecast:', error);
      alert('Failed to load forecast. Please try again.');
    }
  };

  // Delete a saved forecast
  const handleDeleteForecast = async (forecastId: string) => {
    if (!confirm('Are you sure you want to delete this forecast?')) {
      return;
    }

    try {
      const response = await fetch(`/api/forecasting/delete?id=${forecastId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete forecast');
      }

      // Reload forecasts list
      const loadResponse = await fetch('/api/forecasting/load');
      if (loadResponse.ok) {
        const data = await loadResponse.json();
        setSavedForecasts(data.forecasts || []);
      }
    } catch (error) {
      console.error('Error deleting forecast:', error);
      alert('Failed to delete forecast. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Forecasting Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Set targets and calculate expected GOS revenue
            </p>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Date Range:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px] flex-1 sm:flex-none"
              />
              <span className="hidden sm:inline">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px] flex-1 sm:flex-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-azure text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>Save Forecast</span>
          </button>
        </div>
      </div>

      {/* Variables Section */}
      <div className="mb-6 md:mb-8">
        <ForecastingVariables variables={variables} onChange={setVariables} />
      </div>

      {/* Forecasting Table */}
      <div className="mb-6 md:mb-8">
        {loadingClinics ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading clinic data...</p>
          </div>
        ) : (
          <ForecastingTable
            clinics={allClinics}
            clinicData={clinicData}
            dateRange={dateRange}
            variables={variables}
            targetClinics={targetClinics}
            targetTests={targetTests}
            onTargetClinicsChange={handleTargetClinicsChange}
            onTargetTestsChange={handleTargetTestsChange}
          />
        )}
      </div>

      {/* Saved Forecasts List */}
      <div className="mb-6 md:mb-8">
        <SavedForecastsList
          forecasts={savedForecasts}
          loading={loadingForecasts}
          onLoad={handleLoadForecast}
          onDelete={handleDeleteForecast}
        />
      </div>

      {/* Save Forecast Modal */}
      <SaveForecastModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        dateRange={dateRange}
      />
    </div>
  );
}
