'use client';

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface SaveForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  dateRange: { start: string; end: string };
}

export function SaveForecastModal({ isOpen, onClose, onSave, dateRange }: SaveForecastModalProps) {
  const [forecastName, setForecastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!forecastName.trim()) {
      setError('Please enter a forecast name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(forecastName.trim());
      setForecastName('');
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save forecast';
      setError(errorMessage);
      // Keep modal open so user can see the error
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Save Forecast</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-4">
            <label htmlFor="forecastName" className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Name
            </label>
            <input
              type="text"
              id="forecastName"
              value={forecastName}
              onChange={(e) => {
                setForecastName(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
              placeholder="e.g., Q1 2026 Forecast"
              autoFocus
            />
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Date Range:</span>
            </div>
            <div className="text-sm text-gray-700">
              {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !forecastName.trim()}
              className="px-4 py-2 bg-brand-azure text-white rounded-md text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {saving ? 'Saving...' : 'Save Forecast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
