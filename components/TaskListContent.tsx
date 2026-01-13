'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { calculateSmartScore } from '@/lib/task-calculations';
import { Plus, Phone, MapPin, User, X, FileSpreadsheet } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  importance: number;
  notes?: string | null;
  meetingType?: 'in_person' | 'call' | null;
  location?: string | null;
  meetingLink?: string | null;
  recurrence: string;
  recurrenceDays?: string | null;
  isCustomMeeting: boolean;
  isPersonalTask: boolean;
  isAdhocTask: boolean;
  allocatedByUserId?: string | null;
  allocatedByOverride?: string | null;
  allocatedByUser?: {
    id: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function TaskListContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  
  // Form states
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddPersonalTask, setShowAddPersonalTask] = useState(false);
  const [showPushToCompleted, setShowPushToCompleted] = useState(false);
  
  // Regular task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    startDate: '',
    deadline: '',
    importance: 3,
    recurrence: 'none',
    recurrenceDays: [] as string[],
    allocatedByOverride: '',
  });
  
  // Meeting form
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    meetingFor: 'custom' as 'client' | 'custom',
    meetingType: 'in_person' as 'in_person' | 'call',
    location: '',
    meetingLink: '',
    meetingDate: '',
    recurrence: 'none',
    recurrenceDays: [] as string[],
    importance: 3,
    allocatedByOverride: '',
  });
  
  // Personal task form
  const [newPersonalTask, setNewPersonalTask] = useState({
    title: '',
    description: '',
    deadline: '',
    importance: 3,
    recurrence: 'none',
    recurrenceDays: [] as string[],
    allocatedByOverride: '',
  });

  // Push to completed form (adhoc task)
  const [newAdhocTask, setNewAdhocTask] = useState({
    title: '',
    description: '',
    allocatedByOverride: '',
  });
  
  // Notes editing
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [taskCount, setTaskCount] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  // Load tasks
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (deadlineFilter !== 'all') params.append('deadline', deadlineFilter);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tasks');
      }
      
      const loadedTasks = data.data || [];
      setTasks(loadedTasks);
      
      // Count non-completed tasks
      const activeTasks = loadedTasks.filter((t: Task) => t.status !== 'completed');
      setTaskCount(activeTasks.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, deadlineFilter]);

  // Calculate smart scores and sort tasks
  const sortedTasks = useMemo(() => {
    const tasksWithScores = tasks.map(task => ({
      ...task,
      smartScore: calculateSmartScore(task),
    }));
    
    return tasksWithScores.sort((a, b) => {
      // Primary sort: smart score (descending)
      if (b.smartScore !== a.smartScore) {
        return b.smartScore - a.smartScore;
      }
      // Secondary sort: deadline (ascending)
      const deadlineA = new Date(a.deadline).getTime();
      const deadlineB = new Date(b.deadline).getTime();
      return deadlineA - deadlineB;
    });
  }, [tasks]);

  // Check if task is overdue
  const isOverdue = (deadline: string, status: string) => {
    if (status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  // Format recurrence display
  const formatRecurrence = (recurrence: string, recurrenceDays?: string | null) => {
    if (recurrence === 'none') return null;
    if (recurrence === 'custom' && recurrenceDays) {
      const days = recurrenceDays.split(',').map(d => {
        const day = d.trim().toLowerCase();
        return day.charAt(0).toUpperCase() + day.slice(1);
      });
      return `Custom (${days.join(', ')})`;
    }
    return recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
  };

  // Get allocated by text
  const getAllocatedByText = (task: Task) => {
    if (task.allocatedByOverride) {
      return task.allocatedByOverride;
    }
    if (task.allocatedByUser) {
      return task.allocatedByUser.username;
    }
    return 'Unknown';
  };

  // Handle add regular task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title || !newTask.startDate || !newTask.deadline) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (newTask.recurrence === 'custom' && newTask.recurrenceDays.length === 0) {
      setError('Please select at least one day for custom recurrence');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          startDate: newTask.startDate,
          deadline: newTask.deadline,
          importance: newTask.importance,
          recurrence: newTask.recurrence,
          recurrenceDays: newTask.recurrence === 'custom' 
            ? newTask.recurrenceDays.join(',').toLowerCase() 
            : null,
          allocatedByOverride: newTask.allocatedByOverride || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Reset form
      setNewTask({
        title: '',
        description: '',
        startDate: '',
        deadline: '',
        importance: 3,
        recurrence: 'none',
        recurrenceDays: [],
        allocatedByOverride: '',
      });
      setShowAddTask(false);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  // Handle add meeting
  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMeeting.title || !newMeeting.meetingDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (newMeeting.meetingType === 'in_person' && !newMeeting.location) {
      setError('Location is required for in-person meetings');
      return;
    }
    
    if (newMeeting.meetingType === 'call' && !newMeeting.meetingLink) {
      setError('Meeting link is required for call meetings');
      return;
    }
    
    if (newMeeting.recurrence === 'custom' && newMeeting.recurrenceDays.length === 0) {
      setError('Please select at least one day for custom recurrence');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMeeting.title,
          description: newMeeting.description || null,
          startDate: newMeeting.meetingDate,
          deadline: newMeeting.meetingDate,
          importance: newMeeting.importance,
          meetingType: newMeeting.meetingType,
          location: newMeeting.meetingType === 'in_person' ? newMeeting.location : null,
          meetingLink: newMeeting.meetingType === 'call' ? newMeeting.meetingLink : null,
          recurrence: newMeeting.recurrence,
          recurrenceDays: newMeeting.recurrence === 'custom'
            ? newMeeting.recurrenceDays.join(',').toLowerCase()
            : null,
          isCustomMeeting: newMeeting.meetingFor === 'custom',
          allocatedByOverride: newMeeting.allocatedByOverride || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      // Reset form
      setNewMeeting({
        title: '',
        description: '',
        meetingFor: 'custom',
        meetingType: 'in_person',
        location: '',
        meetingLink: '',
        meetingDate: '',
        recurrence: 'none',
        recurrenceDays: [],
        importance: 3,
        allocatedByOverride: '',
      });
      setShowAddMeeting(false);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    }
  };

  // Handle add personal task
  const handleAddPersonalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPersonalTask.title || !newPersonalTask.deadline) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (newPersonalTask.recurrence === 'custom' && newPersonalTask.recurrenceDays.length === 0) {
      setError('Please select at least one day for custom recurrence');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPersonalTask.title,
          description: newPersonalTask.description || null,
          startDate: newPersonalTask.deadline,
          deadline: newPersonalTask.deadline,
          importance: newPersonalTask.importance,
          recurrence: newPersonalTask.recurrence,
          recurrenceDays: newPersonalTask.recurrence === 'custom'
            ? newPersonalTask.recurrenceDays.join(',').toLowerCase()
            : null,
          isPersonalTask: true,
          allocatedByOverride: newPersonalTask.allocatedByOverride || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create personal task');
      }

      // Reset form
      setNewPersonalTask({
        title: '',
        description: '',
        deadline: '',
        importance: 3,
        recurrence: 'none',
        recurrenceDays: [],
        allocatedByOverride: '',
      });
      setShowAddPersonalTask(false);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create personal task');
    }
  };

  // Handle push to completed (adhoc task)
  const handlePushToCompleted = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdhocTask.title) {
      setError('Please enter a task title');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAdhocTask.title,
          description: newAdhocTask.description || null,
          startDate: today.toISOString().split('T')[0],
          deadline: today.toISOString().split('T')[0],
          status: 'completed',
          importance: 3,
          isAdhocTask: true,
          allocatedByOverride: newAdhocTask.allocatedByOverride || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ad-hoc task');
      }

      // Reset form
      setNewAdhocTask({
        title: '',
        description: '',
        allocatedByOverride: '',
      });
      setShowPushToCompleted(false);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad-hoc task');
    }
  };

  // Handle export to productivity
  const handleExportToProductivity = async () => {
    setExporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/productivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to export to productivity');
      }

      // Show success message
      alert(`Productivity report ${data.message.toLowerCase()}. You can view it on the Productivity page.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to productivity');
    } finally {
      setExporting(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Handle importance update
  const handleUpdateImportance = async (taskId: string, newImportance: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importance: newImportance }),
      });

      if (!response.ok) {
        throw new Error('Failed to update importance');
      }

      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update importance');
    }
  };

  // Handle notes update
  const handleUpdateNotes = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      setEditingNotes(null);
      setNotesValue('');
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Toggle custom recurrence day
  const toggleRecurrenceDay = (day: string, type: 'task' | 'meeting' | 'personal') => {
    if (type === 'task') {
      setNewTask(prev => ({
        ...prev,
        recurrenceDays: prev.recurrenceDays.includes(day)
          ? prev.recurrenceDays.filter(d => d !== day)
          : [...prev.recurrenceDays, day],
      }));
    } else if (type === 'meeting') {
      setNewMeeting(prev => ({
        ...prev,
        recurrenceDays: prev.recurrenceDays.includes(day)
          ? prev.recurrenceDays.filter(d => d !== day)
          : [...prev.recurrenceDays, day],
      }));
    } else {
      setNewPersonalTask(prev => ({
        ...prev,
        recurrenceDays: prev.recurrenceDays.includes(day)
          ? prev.recurrenceDays.filter(d => d !== day)
          : [...prev.recurrenceDays, day],
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Orange Warning Banner */}
      <div className="mb-4 md:mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-orange-800">
              <strong>Personal tasks will be removed - was migrated from borrowed code.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Steve Task List
          </h1>
          {!loading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand-jade text-white">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          )}
        </div>
        <p className="text-sm md:text-base text-gray-600">
          Manage your tasks, meetings, and personal items
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex justify-between items-center">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => {
            setShowAddTask(true);
            setShowAddMeeting(false);
            setShowAddPersonalTask(false);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-azure text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
        
        <button
          onClick={() => {
            setShowAddMeeting(true);
            setShowAddTask(false);
            setShowAddPersonalTask(false);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Meeting</span>
        </button>
        
        <button
          onClick={() => {
            setShowAddPersonalTask(true);
            setShowAddTask(false);
            setShowAddMeeting(false);
            setShowPushToCompleted(false);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-jade text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Personal Task</span>
        </button>
        
        <button
          onClick={() => {
            setShowPushToCompleted(true);
            setShowAddTask(false);
            setShowAddMeeting(false);
            setShowAddPersonalTask(false);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Push to Completed</span>
        </button>
        
        <button
          onClick={handleExportToProductivity}
          disabled={exporting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{exporting ? 'Exporting...' : 'Export to Productivity'}</span>
        </button>
      </div>

      {/* Regular Task Form */}
      {showAddTask && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Add New Task</h2>
            <button
              onClick={() => setShowAddTask(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start From Date *
                </label>
                <input
                  type="date"
                  required
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance (1-5)
                </label>
                <select
                  value={newTask.importance}
                  onChange={(e) => setNewTask({ ...newTask, importance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence
                </label>
                <select
                  value={newTask.recurrence}
                  onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value, recurrenceDays: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {newTask.recurrence === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRecurrenceDay(day.toLowerCase(), 'task')}
                        className={`px-3 py-1 rounded-md text-sm min-h-[44px] ${
                          newTask.recurrenceDays.includes(day.toLowerCase())
                            ? 'bg-brand-azure text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated By (optional override)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use your username"
                  value={newTask.allocatedByOverride}
                  onChange={(e) => setNewTask({ ...newTask, allocatedByOverride: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-azure text-white rounded-md hover:bg-opacity-90 min-h-[44px]"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting Form */}
      {showAddMeeting && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Add New Meeting</h2>
            <button
              onClick={() => setShowAddMeeting(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddMeeting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting For
                </label>
                <select
                  value={newMeeting.meetingFor}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingFor: e.target.value as 'client' | 'custom' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                >
                  <option value="custom">Custom Meeting</option>
                  <option value="client">Client Meeting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Type *
                </label>
                <select
                  value={newMeeting.meetingType}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingType: e.target.value as 'in_person' | 'call', location: '', meetingLink: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                >
                  <option value="in_person">In Person</option>
                  <option value="call">Call</option>
                </select>
              </div>
              
              {newMeeting.meetingType === 'in_person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required={newMeeting.meetingType === 'in_person'}
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                  />
                </div>
              )}
              
              {newMeeting.meetingType === 'call' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teams/Zoom Link *
                  </label>
                  <input
                    type="url"
                    required={newMeeting.meetingType === 'call'}
                    value={newMeeting.meetingLink}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meetingLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  required
                  value={newMeeting.meetingDate}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence *
                </label>
                <select
                  value={newMeeting.recurrence}
                  onChange={(e) => setNewMeeting({ ...newMeeting, recurrence: e.target.value, recurrenceDays: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {newMeeting.recurrence === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRecurrenceDay(day.toLowerCase(), 'meeting')}
                        className={`px-3 py-1 rounded-md text-sm min-h-[44px] ${
                          newMeeting.recurrenceDays.includes(day.toLowerCase())
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance (1-5)
                </label>
                <select
                  value={newMeeting.importance}
                  onChange={(e) => setNewMeeting({ ...newMeeting, importance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated By (optional override)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use your username"
                  value={newMeeting.allocatedByOverride}
                  onChange={(e) => setNewMeeting({ ...newMeeting, allocatedByOverride: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-opacity-90 min-h-[44px]"
              >
                Create Meeting
              </button>
              <button
                type="button"
                onClick={() => setShowAddMeeting(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Personal Task Form */}
      {showAddPersonalTask && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Add Personal Task</h2>
            <button
              onClick={() => setShowAddPersonalTask(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddPersonalTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPersonalTask.title}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newPersonalTask.deadline}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance (1-5)
                </label>
                <select
                  value={newPersonalTask.importance}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, importance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence
                </label>
                <select
                  value={newPersonalTask.recurrence}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, recurrence: e.target.value, recurrenceDays: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade min-h-[44px]"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {newPersonalTask.recurrence === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRecurrenceDay(day.toLowerCase(), 'personal')}
                        className={`px-3 py-1 rounded-md text-sm min-h-[44px] ${
                          newPersonalTask.recurrenceDays.includes(day.toLowerCase())
                            ? 'bg-brand-jade text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newPersonalTask.description}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated By (optional override)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use your username"
                  value={newPersonalTask.allocatedByOverride}
                  onChange={(e) => setNewPersonalTask({ ...newPersonalTask, allocatedByOverride: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-jade min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-jade text-white rounded-md hover:bg-opacity-90 min-h-[44px]"
              >
                Create Personal Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddPersonalTask(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Push to Completed Form (Ad-hoc Task) */}
      {showPushToCompleted && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Push to Completed</h2>
              <p className="text-sm text-gray-600 mt-1">Create an ad-hoc task that was completed today</p>
            </div>
            <button
              onClick={() => setShowPushToCompleted(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handlePushToCompleted} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={newAdhocTask.title}
                onChange={(e) => setNewAdhocTask({ ...newAdhocTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 min-h-[44px]"
                placeholder="What task did you complete?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newAdhocTask.description}
                onChange={(e) => setNewAdhocTask({ ...newAdhocTask, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Optional details about the task"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocated By (optional override)
              </label>
              <input
                type="text"
                placeholder="Leave empty to use your username"
                value={newAdhocTask.allocatedByOverride}
                onChange={(e) => setNewAdhocTask({ ...newAdhocTask, allocatedByOverride: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 min-h-[44px]"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-opacity-90 min-h-[44px]"
              >
                Save as Completed
              </button>
              <button
                type="button"
                onClick={() => setShowPushToCompleted(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Filter
            </label>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
            >
              <option value="all">All Deadlines</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No tasks found. Create your first task above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const smartScore = task.smartScore || calculateSmartScore(task);
            const overdue = isOverdue(task.deadline, task.status);
            const recurrenceText = formatRecurrence(task.recurrence, task.recurrenceDays);
            
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {task.meetingType === 'call' && <Phone className="h-5 w-5 text-purple-600" />}
                      {task.meetingType === 'in_person' && <MapPin className="h-5 w-5 text-purple-600" />}
                      {task.isPersonalTask && <User className="h-5 w-5 text-brand-jade" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {task.title}
                      </h3>
                      {task.isCustomMeeting && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded mb-2">
                          Custom Meeting
                        </span>
                      )}
                      {task.isPersonalTask && (
                        <span className="inline-block px-2 py-1 bg-brand-jade bg-opacity-20 text-brand-jade text-xs rounded mb-2">
                          Personal Task
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </span>
                    
                    {/* Overdue Badge */}
                    {overdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        Overdue
                      </span>
                    )}
                    
                    {/* Importance Badge */}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      📢 {task.importance}/5
                    </span>
                    
                    {/* Smart Score Badge */}
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs font-medium">
                      Score: {smartScore}
                    </span>
                  </div>
                </div>

                {/* Allocated By */}
                <div className="mb-3 text-sm text-gray-600">
                  <strong>Allocated by:</strong> {getAllocatedByText(task)}
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mb-3 text-sm text-gray-700">
                    {task.description}
                  </div>
                )}

                {/* Meeting Details */}
                {task.meetingType === 'in_person' && task.location && (
                  <div className="mb-3 text-sm text-gray-600">
                    <strong>📍 Location:</strong> {task.location}
                  </div>
                )}
                
                {task.meetingType === 'call' && task.meetingLink && (
                  <div className="mb-3 text-sm text-gray-600">
                    <strong>📞 Meeting Link:</strong>{' '}
                    <a
                      href={task.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-azure hover:underline"
                    >
                      {task.meetingLink}
                    </a>
                  </div>
                )}

                {/* Notes Section */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <strong className="text-sm text-gray-700">Notes:</strong>
                    {editingNotes !== task.id && (
                      <button
                        onClick={() => {
                          setEditingNotes(task.id);
                          setNotesValue(task.notes || '');
                        }}
                        className="text-sm text-brand-azure hover:underline min-h-[44px]"
                      >
                        {task.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    )}
                  </div>
                  
                  {editingNotes === task.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNotes(task.id)}
                          className="px-3 py-1 bg-brand-azure text-white rounded text-sm hover:bg-opacity-90 min-h-[44px]"
                        >
                          Save Notes
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(null);
                            setNotesValue('');
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 min-h-[44px]">
                      {task.notes || 'No notes'}
                    </div>
                  )}
                </div>

                {/* Date Information */}
                <div className="mb-4 text-sm text-gray-600 space-y-1">
                  {!task.isPersonalTask && (
                    <div>
                      <strong>Start Date:</strong> {new Date(task.startDate).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <strong>{task.isPersonalTask ? 'Date' : 'Deadline'}:</strong>{' '}
                    {new Date(task.deadline).toLocaleDateString()}
                  </div>
                  {recurrenceText && (
                    <div>
                      <strong>Recurrence:</strong> {recurrenceText}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Importance:</label>
                    <select
                      value={task.importance}
                      onChange={(e) => handleUpdateImportance(task.id, parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 min-h-[44px]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
