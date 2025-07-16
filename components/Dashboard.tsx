'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClinicStatus, ShiftData } from '@/lib/clinics';
import { ClinicCard } from './ClinicCard';
import { ClinicDetailsModal } from './ClinicDetailsModal';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Activity, Eye, Users, HelpCircle } from 'lucide-react';

// Define the expected clinic data structure with computed status
interface ClinicWithStatus extends ClinicStatus {
  computedStatus?: 'operational' | 'limited' | 'non-functional' | 'error';
}

export function Dashboard() {
  // Calculate default date range (3 weeks 6 days from today)
  const getDefaultDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 27); // 3 weeks 6 days (27 days) from today
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const [clinicData, setClinicData] = useState<ClinicWithStatus[]>([]);
  const [filteredClinicData, setFilteredClinicData] = useState<ClinicWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rotaData, setRotaData] = useState<any>(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Function to parse various date formats to a consistent Date object
  const parseShiftDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Handle "Monday 16/7" format - extract just the date part
      const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, month - 1, day); // month is 0-indexed
      }
      
      // Handle ISO format (YYYY-MM-DD)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString);
      }
      
      // Fallback - try to parse as-is
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`);
      return null;
    }
  };

  // Function to filter clinic data based on date range
  const filterClinicsByDateRange = useCallback((clinics: ClinicWithStatus[]) => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return clinics.map(clinic => ({
      ...clinic,
      shifts: clinic.shifts?.filter(shift => {
        const shiftDate = parseShiftDate(shift.date);
        if (!shiftDate) return false;
        
        return shiftDate >= startDate && shiftDate <= endDate;
      }) || []
    })).map(clinic => ({
      ...clinic,
      computedStatus: computeClinicStatus(clinic)
    }));
  }, [dateRange]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const url = forceRefresh ? '/api/clinics?force=true' : '/api/clinics';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle new API response structure
      const clinics = data.clinics || data;
      // Add computed status to each clinic
      const clinicsWithStatus = clinics.map((clinic: ClinicStatus) => ({
        ...clinic,
        computedStatus: computeClinicStatus(clinic)
      }));
      setClinicData(clinicsWithStatus);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clinic data');
      console.error('Error fetching clinic data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const computeClinicStatus = (clinic: ClinicStatus): 'operational' | 'limited' | 'non-functional' | 'error' => {
    if (clinic.error) {
      return 'error';
    } 
    
    if (!clinic.shifts || clinic.shifts.length === 0) {
      return 'non-functional';
    }

    // Group shifts by week and calculate functioning weeks
    const weekMap = new Map<string, boolean>();
    
    clinic.shifts.forEach(shift => {
      const shiftDate = parseShiftDate(shift.date);
      if (!shiftDate) return;
      
      // Get week identifier (year-week)
      const year = shiftDate.getFullYear();
      const weekStart = new Date(shiftDate);
      weekStart.setDate(shiftDate.getDate() - shiftDate.getDay()); // Start of week (Sunday)
      const weekKey = `${year}-${Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
      
      // Check if this shift is properly staffed
      const roles = shift.jobRoles || [];
      const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
      const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
      const isProperlyStaffed = hasOptometrist && hasAssistant;
      
      // If week doesn't exist or this shift is properly staffed, update the week status
      if (!weekMap.has(weekKey) || isProperlyStaffed) {
        weekMap.set(weekKey, weekMap.get(weekKey) || isProperlyStaffed);
      }
    });

    // Calculate percentage of weeks that can run (have at least 1 properly staffed shift)
    const totalWeeks = weekMap.size;
    const functioningWeeks = Array.from(weekMap.values()).filter(canRun => canRun).length;
    const percentage = totalWeeks > 0 ? (functioningWeeks / totalWeeks) * 100 : 0;

    // Determine status based on percentage of functioning weeks
    if (percentage >= 75) {
      return 'operational';
    } else if (percentage >= 50) {
      return 'limited';
    } else {
      return 'non-functional';
    }
  };

  const fetchClinicDetails = async (clinicName: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/clinics/${encodeURIComponent(clinicName)}/rota`);
      if (response.ok) {
        const data = await response.json();
        setRotaData(data.rota || []);
      } else {
        // For now, use mock rota data
        setRotaData(generateMockRotaData());
      }
    } catch (error) {
      console.error('Error fetching clinic details:', error);
      // Use mock data as fallback
      setRotaData(generateMockRotaData());
    } finally {
      setLoadingDetails(false);
    }
  };

  const generateMockRotaData = () => {
    const dates = ['16/07/2025', '17/07/2025', '18/07/2025', '19/07/2025', '22/07/2025'];
    const roles = ['Optometrist', 'Assistant', 'Support Staff'];
    const statuses = ['available', 'busy', 'break'] as const;
    
    const schedule = dates.map(date => ({
      date,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      anonymizedName: `Staff ${Math.floor(Math.random() * 20) + 1}`
    }));

    return {
      clinicDate: new Date().toLocaleDateString(),
      notes: 'Mock data for testing',
      optomCount: Math.floor(Math.random() * 5) + 2,
      assistantCount: Math.floor(Math.random() * 3) + 1,
      schedule
    };
  };

  const handleClinicClick = async (clinic: ClinicStatus) => {
    setSelectedClinic(clinic);
    setIsModalOpen(true);
    await fetchClinicDetails(clinic.clinic);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClinic(null);
    setRotaData([]);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchData(true); // Force refresh
  };

  // Apply date filtering whenever clinic data or date range changes
  useEffect(() => {
    const filtered = filterClinicsByDateRange(clinicData);
    setFilteredClinicData(filtered);
  }, [clinicData, filterClinicsByDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const getStatusCounts = () => {
    const counts = {
      operational: 0,
      limited: 0,
      'non-functional': 0,
      error: 0
    };

    filteredClinicData.forEach(clinic => {
      const status = clinic.computedStatus || 'error';
      counts[status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();
  
  // Calculate new dashboard metrics
  // 1. Total scraped shifts (Clinic # Potential)
  const totalScrapedShifts = filteredClinicData.reduce((sum, clinic) => sum + (clinic.shifts?.length || 0), 0);
  
  // 2. Clinics Running as % (functioning shifts / total shifts)
  const totalFunctioningShifts = filteredClinicData.reduce((sum, clinic) => {
    return sum + (clinic.shifts?.filter(shift => {
      const roles = shift.jobRoles || [];
      const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
      const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
      return hasOptometrist && hasAssistant;
    }).length || 0);
  }, 0);
  const clinicsRunningPercentage = totalScrapedShifts > 0 ? Math.round((totalFunctioningShifts / totalScrapedShifts) * 100) : 0;
  
  // 3. Total optometrists required
  const totalOptometristsRequired = filteredClinicData.reduce((sum, clinic) => {
    const requiredOptometrists = clinic.shifts?.length || 0;
    let assignedOptometrists = 0;
    clinic.shifts?.forEach(shift => {
      const roles = shift.jobRoles || [];
      const hasOptometrist = roles.some(role => role.toLowerCase().includes('optometrist'));
      if (hasOptometrist) assignedOptometrists += 1;
    });
    return sum + Math.max(0, requiredOptometrists - assignedOptometrists);
  }, 0);
  
  // 4. Total assistants required
  const totalAssistantsRequired = filteredClinicData.reduce((sum, clinic) => {
    const requiredAssistants = clinic.shifts?.length || 0;
    let assignedAssistants = 0;
    clinic.shifts?.forEach(shift => {
      const roles = shift.jobRoles || [];
      const hasAssistant = roles.some(role => role.toLowerCase().includes('assistant'));
      if (hasAssistant) assignedAssistants += 1;
    });
    return sum + Math.max(0, requiredAssistants - assignedAssistants);
  }, 0);

  if (loading && clinicData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Clinic Data</h2>
          <p className="text-gray-500">Fetching real-time information from all clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Clinic Availability Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time monitoring of clinic operations and staffing levels
            </p>
            <p className="text-sm text-blue-600 mt-1">
              💡 Click on any clinic card to view detailed schedule
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredClinicData.length} clinics with shifts in selected date range 
              ({new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()})
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Date Range Picker */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Date Range:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Auto-refresh</span>
            </label>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Guide Section */}
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">How the Dashboard Works</h3>
          </div>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">📅 Date Range</h4>
              <p>Default date range is always 4 weeks unless changed manually. All statistics and status calculations are based on this selected date range.</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🎯 Status Calculation</h4>
              <p>
                The status (Operational, Limited, Non-Functional) is based on the percentage of <strong>WEEKS</strong> running within the selected period, not individual clinic sessions:
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li><span className="font-medium text-green-700">Operational:</span> 75% or more weeks running</li>
                <li><span className="font-medium text-yellow-700">Limited:</span> 74% to 26% weeks running</li>
                <li><span className="font-medium text-red-700">Non-Functional:</span> 25% or less weeks running</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🏥 Operational Flow</h4>
              <p>
                Although clinic cards display the number of individual clinic sessions, the operational status is based purely on 'operational flow'. 
                For example: If a centre like Manchester runs 4 clinics in 1 week, then none for 3 weeks, this counts as only 1 functioning week 
                because operational services like glasses collections cannot be maintained consistently.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">👥 Assistant Requirements</h4>
              <p>
                The "Assistants Required" number is calculated based on the minimum requirement of <strong>1 assistant per clinic session</strong>. 
                Each shift needs at least 1 optometrist and 1 assistant to be considered properly staffed.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clinic # Potential</p>
                <p className="text-2xl font-bold text-green-600">{totalScrapedShifts}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clinics Running</p>
                <p className="text-2xl font-bold text-orange-600">{clinicsRunningPercentage}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optometrists Required</p>
                <p className="text-2xl font-bold text-red-600">{totalOptometristsRequired}</p>
              </div>
              <Eye className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assistants Required</p>
                <p className="text-2xl font-bold text-blue-600">{totalAssistantsRequired}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastRefresh && (
          <div className="text-sm text-gray-500 mb-6">
            Last updated: {lastRefresh.toLocaleString()}
          </div>
        )}
      </div>

      {/* Clinic Grid */}
      {filteredClinicData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClinicData.map((clinic, index) => (
            <ClinicCard 
              key={`${clinic.clinic}-${index}`} 
              clinicData={clinic}
              onClick={() => handleClinicClick(clinic)}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-4">Unable to load clinic information at this time.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : null}

      {/* Clinic Details Modal */}
      {selectedClinic && (
        <ClinicDetailsModal
          clinic={selectedClinic}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Loading overlay for modal */}
      {loadingDetails && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-700">Loading schedule details...</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          Clinic Availability Dashboard • Real-time data from {clinicData.length} healthcare facilities
        </p>
        <p className="mt-1">
          Total Scraped Shifts: {totalScrapedShifts} • Running at {clinicsRunningPercentage}% • Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}
        </p>
      </footer>
    </div>
  );
} 