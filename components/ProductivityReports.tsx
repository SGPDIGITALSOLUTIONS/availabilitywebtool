'use client';

import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileSpreadsheet, Calendar } from 'lucide-react';

interface ProductivityReport {
  id: string;
  reportDate: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  adhocTasks: number;
  averageUrgency: number;
  createdAt: string;
}

export function ProductivityReports() {
  const [reports, setReports] = useState<ProductivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/productivity');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data || []);
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = async (reportId: string, reportDate: string) => {
    try {
      const response = await fetch(`/api/productivity/${reportId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productivity-report-${reportDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/productivity/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <FileSpreadsheet className="h-6 w-6 md:h-8 md:w-8 text-brand-azure" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Productivity Reports
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600">
          Daily task statistics saved at midnight. Download or delete reports as needed.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No productivity reports found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Reports are automatically generated at midnight each day.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {formatDate(report.reportDate)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Generated {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(report.id, report.reportDate.split('T')[0])}
                    className="flex items-center space-x-2 px-3 py-2 bg-brand-azure text-white rounded-md hover:bg-opacity-90 transition-colors min-h-[44px]"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">Download</span>
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-opacity-90 transition-colors min-h-[44px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:inline">Delete</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Tasks</p>
                  <p className="text-xl font-bold text-gray-900">{report.totalTasks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Completed</p>
                  <p className="text-xl font-bold text-green-600">{report.completedTasks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{report.pendingTasks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">{report.inProgressTasks}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Ad-hoc Tasks (That Day)</p>
                  <p className="text-xl font-bold text-purple-600">{report.adhocTasks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Average Urgency</p>
                  <p className="text-xl font-bold text-gray-900">{report.averageUrgency.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
