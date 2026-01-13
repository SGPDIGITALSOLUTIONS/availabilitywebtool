'use client';

import React from 'react';
import { Calendar, Clock, Trash2, Loader2 } from 'lucide-react';

export interface SavedForecast {
  id: string;
  name: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedForecastsListProps {
  forecasts: SavedForecast[];
  loading: boolean;
  onLoad: (forecastId: string) => Promise<void>;
  onDelete: (forecastId: string) => Promise<void>;
}

export function SavedForecastsList({ forecasts, loading, onLoad, onDelete }: SavedForecastsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading saved forecasts...</span>
        </div>
      </div>
    );
  }

  if (forecasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Forecasts</h3>
        <p className="text-sm text-gray-600">No saved forecasts yet. Save a forecast to see it here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Saved Forecasts</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {forecasts.map((forecast) => (
          <div
            key={forecast.id}
            className="p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onLoad(forecast.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-2 truncate">
                  {forecast.name}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(forecast.dateRangeStart)} - {formatDate(forecast.dateRangeEnd)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Saved {formatDateTime(forecast.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(forecast.id);
                }}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Delete forecast"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
