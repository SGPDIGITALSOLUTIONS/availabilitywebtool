'use client';

import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileSpreadsheet, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface TaskDetail {
  id: string;
  title: string;
  deadline: string;
  importance: number;
  allocatedBy: string;
  isAdhoc?: boolean;
  completedAt?: string;
}

interface TaskDetails {
  pending: TaskDetail[];
  completed: TaskDetail[];
}

interface ProductivityReport {
  id: string;
  reportDate: string;
  plannedTasksCompletedToday: number;
  adhocTasksCompletedToday: number;
  totalTasksCompletedToday: number;
  taskDetails: TaskDetails | null;
  createdAt: string;
}

export function ProductivityReports() {
  const [reports, setReports] = useState<ProductivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

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

  const toggleExpand = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

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

  const handleGenerateDetailedCSV = (report: ProductivityReport) => {
    try {
      const rows: string[][] = [];
      
      // Header
      rows.push(['Date', 'Planned Tasks Completed Today', 'Ad-hoc Tasks Completed Today', 'Total Tasks Completed Today']);
      rows.push([
        new Date(report.reportDate).toISOString().split('T')[0],
        report.plannedTasksCompletedToday.toString(),
        report.adhocTasksCompletedToday.toString(),
        report.totalTasksCompletedToday.toString(),
      ]);

      // Empty row
      rows.push([]);

      // Pending tasks section
      if (report.taskDetails && report.taskDetails.pending.length > 0) {
        rows.push(['PENDING TASKS']);
        rows.push(['Title', 'Deadline', 'Importance', 'Allocated By']);
        report.taskDetails.pending.forEach(task => {
          rows.push([
            task.title,
            new Date(task.deadline).toLocaleDateString(),
            task.importance.toString(),
            task.allocatedBy,
          ]);
        });
        rows.push([]);
      }

      // Completed tasks section
      if (report.taskDetails && report.taskDetails.completed.length > 0) {
        rows.push(['COMPLETED TASKS']);
        rows.push(['Title', 'Deadline', 'Importance', 'Type', 'Allocated By', 'Completed At']);
        report.taskDetails.completed.forEach(task => {
          rows.push([
            task.title,
            new Date(task.deadline).toLocaleDateString(),
            task.importance.toString(),
            task.isAdhoc ? 'Ad-hoc' : 'Planned',
            task.allocatedBy,
            task.completedAt ? new Date(task.completedAt).toLocaleString() : '',
          ]);
        });
      }

      // Convert to CSV
      const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productivity-report-detailed-${report.reportDate.split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate detailed CSV');
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
          {reports.map((report) => {
            const isExpanded = expandedReports.has(report.id);
            return (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="p-4 md:p-6">
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
                        title="Download summary CSV"
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Planned Tasks Completed</p>
                      <p className="text-2xl font-bold text-blue-600">{report.plannedTasksCompletedToday}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Ad-hoc Tasks Completed</p>
                      <p className="text-2xl font-bold text-purple-600">{report.adhocTasksCompletedToday}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Total Tasks Completed</p>
                      <p className="text-2xl font-bold text-green-600">{report.totalTasksCompletedToday}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(report.id)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors min-h-[44px]"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {isExpanded ? 'Hide' : 'Show'} Task Details
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>

                {isExpanded && report.taskDetails && (
                  <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
                    <div className="space-y-6">
                      {/* Pending Tasks */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span>Pending Tasks</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({report.taskDetails.pending.length})
                          </span>
                        </h4>
                        {report.taskDetails.pending.length > 0 ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Title</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Deadline</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Importance</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Allocated By</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {report.taskDetails.pending.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-gray-900">{task.title}</td>
                                      <td className="px-4 py-2 text-gray-600">
                                        {new Date(task.deadline).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-2 text-gray-600">{task.importance}</td>
                                      <td className="px-4 py-2 text-gray-600">{task.allocatedBy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No pending tasks</p>
                        )}
                      </div>

                      {/* Completed Tasks */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span>Completed Tasks</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({report.taskDetails.completed.length})
                          </span>
                        </h4>
                        {report.taskDetails.completed.length > 0 ? (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Title</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Deadline</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Importance</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Allocated By</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Completed At</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {report.taskDetails.completed.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-gray-900">{task.title}</td>
                                      <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          task.isAdhoc 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {task.isAdhoc ? 'Ad-hoc' : 'Planned'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-gray-600">
                                        {new Date(task.deadline).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-2 text-gray-600">{task.importance}</td>
                                      <td className="px-4 py-2 text-gray-600">{task.allocatedBy}</td>
                                      <td className="px-4 py-2 text-gray-600">
                                        {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No completed tasks</p>
                        )}
                      </div>

                      {/* Generate Detailed CSV Button */}
                      <div className="pt-4 border-t border-gray-300">
                        <button
                          onClick={() => handleGenerateDetailedCSV(report)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-opacity-90 transition-colors min-h-[44px]"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Generate Detailed CSV with Task Lists</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
