'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TaskStats {
  totalTasks: number;
  averageUrgency: number;
  mostUrgentTask: {
    id: string;
    title: string;
    urgencyScore: number;
    deadline: string;
    status: string;
    importance: number;
  } | null;
}

export function TaskStats() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/tasks/stats');
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error loading task stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 mb-6">
        <p className="text-gray-600">Loading task statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(date);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''} overdue`;
    } else if (daysDiff === 0) {
      return 'Due today';
    } else if (daysDiff === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysDiff} days`;
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 30) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 md:h-6 md:w-6 text-brand-jade" />
          <span>Task Statistics</span>
        </h2>
        <Link
          href="/tasks"
          className="text-sm text-brand-jade hover:text-brand-jade/80 font-medium"
        >
          View All Tasks →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Task Number */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckSquare className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Current Tasks</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {stats.totalTasks}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active tasks</p>
        </div>

        {/* Average Urgency */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Average Urgency</h3>
          </div>
          <p className={`text-2xl md:text-3xl font-bold ${getUrgencyColor(stats.averageUrgency)}`}>
            {stats.averageUrgency.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {getUrgencyLabel(stats.averageUrgency)} priority
          </p>
        </div>

        {/* Most Urgent Task */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Most Urgent</h3>
          </div>
          {stats.mostUrgentTask ? (
            <>
              <p className="text-sm md:text-base font-semibold text-gray-900 truncate mb-1">
                {stats.mostUrgentTask.title}
              </p>
              <p className={`text-xs font-medium ${getUrgencyColor(stats.mostUrgentTask.urgencyScore)} mb-1`}>
                Score: {stats.mostUrgentTask.urgencyScore} ({getUrgencyLabel(stats.mostUrgentTask.urgencyScore)})
              </p>
              <p className="text-xs text-gray-500">
                {formatDeadline(stats.mostUrgentTask.deadline)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No urgent tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}
