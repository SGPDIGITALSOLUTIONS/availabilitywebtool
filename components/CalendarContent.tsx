'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { calculateSmartScore } from '@/lib/task-calculations';
import { ChevronLeft, ChevronRight, Phone, MapPin, Calendar as CalendarIcon, X, User } from 'lucide-react';

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
  allocatedByUser?: {
    id: string;
    username: string;
  } | null;
  allocatedByOverride?: string | null;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  color?: string | null;
}

// Color palette for automatic color assignment
const colors = [
  '#271d7a', '#00c2de', '#8b5cf6', '#ffc762', '#10b981', '#3b82f6',
  '#ef4444', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6',
  '#f97316', '#84cc16', '#a855f7', '#e11d48', '#0ea5e9', '#22c55e',
  '#64748b', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
  '#a855f7', '#e11d48', '#0ea5e9', '#22c55e', '#64748b', '#8b5cf6',
  // Add more colors for variety
  '#1e40af', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#c026d3',
  '#0891b2', '#4f46e5', '#16a34a', '#ca8a04', '#be185d', '#0284c7',
  '#0d9488', '#9333ea', '#b91c1c', '#c2410c', '#a21caf', '#0c4a6e',
  '#115e59', '#7e22ce', '#991b1b', '#9a3412', '#86198f', '#075985',
  '#0f766e', '#6b21a8', '#7f1d1d', '#7c2d12', '#701a75', '#0c4a6e',
  '#134e4a', '#581c87', '#450a0a', '#431407', '#581c87', '#164e63',
  '#155e75', '#4c1d95', '#7c2d12', '#6b21a8', '#1e3a8a', '#1e40af',
  '#312e81', '#581c87', '#7c2d12', '#6b21a8', '#1e3a8a', '#1e40af',
  '#312e81', '#581c87', '#7c2d12', '#6b21a8', '#1e3a8a', '#1e40af',
];

// Generate color from ID (for users/clients without custom colors)
function getColorFromId(id: string | null | undefined, customColor?: string | null): string {
  if (customColor) return customColor;
  if (!id) return '#6b7280'; // Gray for tasks without client/user
  
  // Hash the ID to get a consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Get task color based on client or allocatedByUser
function getTaskColor(task: Task): string {
  // Custom meetings use gray
  if (task.isCustomMeeting) {
    return '#6b7280';
  }
  
  // If task has a client, use client color
  if (task.client) {
    return getColorFromId(task.client.id, task.client.color);
  }
  
  // Otherwise use allocatedByUser for color
  if (task.allocatedByUser) {
    return getColorFromId(task.allocatedByUser.id);
  }
  
  // Fallback to gray
  return '#6b7280';
}

export function CalendarContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'deadline' | 'urgency' | 'client' | 'status'>('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load tasks
  const loadTasks = async () => {
    console.log('[Calendar] loadTasks called');
    setLoading(true);
    setError(null);
    try {
      console.log('[Calendar] Fetching /api/tasks...');
      const response = await fetch('/api/tasks');
      console.log('[Calendar] Response status:', response.status, response.statusText);
      console.log('[Calendar] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Calendar] Response not OK. Status:', response.status);
        console.error('[Calendar] Response body:', errorText);
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Calendar] Response data:', {
        success: data.success,
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        error: data.error,
        message: data.message,
      });
      
      if (data.success) {
        const loadedTasks = data.data || [];
        console.log('[Calendar] SUCCESS: Loaded', loadedTasks.length, 'tasks');
        if (loadedTasks.length > 0) {
          console.log('[Calendar] Sample task:', {
            id: loadedTasks[0].id,
            title: loadedTasks[0].title,
            startDate: loadedTasks[0].startDate,
            deadline: loadedTasks[0].deadline,
          });
        }
        setTasks(loadedTasks);
      } else {
        console.error('[Calendar] API returned success=false:', data);
        setError(data.error || data.message || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('[Calendar] ERROR: Exception caught while fetching tasks');
      console.error('[Calendar] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[Calendar] Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error('[Calendar] Error stack:', error.stack);
      }
      setError(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
      console.log('[Calendar] loadTasks completed, loading set to false');
    }
  };

  // Fetch tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Fetch clients (if API exists)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setClients(data.data || []);
          }
        }
      } catch (error) {
        // Clients API might not exist yet, that's okay
        console.log('Clients API not available');
      }
    };

    fetchClients();
  }, []);

  // Create a map of client IDs to client data for quick lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach(client => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  // Enrich tasks with client data
  const enrichedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      client: task.client || (task.clientId ? clientMap.get(task.clientId) : undefined),
    }));
  }, [tasks, clientMap]);

  // Get tasks for a specific date (appear on startDate or deadline)
  // Excludes completed tasks
  const getTasksForDate = (date: Date): Task[] => {
    if (!enrichedTasks || enrichedTasks.length === 0) return [];
    
    // Normalize date to YYYY-MM-DD format (local timezone)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return enrichedTasks.filter(task => {
      // Exclude completed tasks
      if (task.status === 'completed') return false;
      
      if (!task.startDate || !task.deadline) return false;
      
      try {
        // Parse dates and normalize to YYYY-MM-DD format
        const startDate = new Date(task.startDate);
        const deadline = new Date(task.deadline);
        
        const startYear = startDate.getFullYear();
        const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const startDay = String(startDate.getDate()).padStart(2, '0');
        const startDateStr = `${startYear}-${startMonth}-${startDay}`;
        
        const deadlineYear = deadline.getFullYear();
        const deadlineMonth = String(deadline.getMonth() + 1).padStart(2, '0');
        const deadlineDay = String(deadline.getDate()).padStart(2, '0');
        const deadlineStr = `${deadlineYear}-${deadlineMonth}-${deadlineDay}`;
        
        return startDateStr === dateStr || deadlineStr === dateStr;
      } catch (e) {
        console.error('Error parsing task date:', e, task);
        return false;
      }
    });
  };

  // Sort tasks
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    const tasksWithScores = tasksToSort.map(task => ({
      ...task,
      smartScore: calculateSmartScore({
        id: task.id,
        title: task.title,
        deadline: task.deadline,
        status: task.status,
        importance: task.importance,
        createdAt: task.startDate,
        updatedAt: task.startDate,
      }),
    }));

    switch (sortBy) {
      case 'deadline':
        return tasksWithScores.sort((a, b) => {
          const dateA = new Date(a.deadline).getTime();
          const dateB = new Date(b.deadline).getTime();
          return dateA - dateB;
        });
      case 'urgency':
        return tasksWithScores.sort((a, b) => b.smartScore - a.smartScore);
      case 'client':
        return tasksWithScores.sort((a, b) => {
          const clientA = a.client?.name || a.allocatedByUser?.username || a.allocatedByOverride || 'ZZZ';
          const clientB = b.client?.name || b.allocatedByUser?.username || b.allocatedByOverride || 'ZZZ';
          return clientA.localeCompare(clientB);
        });
      case 'status':
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
        return tasksWithScores.sort((a, b) => {
          return statusOrder[a.status] - statusOrder[b.status];
        });
      default:
        return tasksWithScores;
    }
  };

  // Get selected date tasks
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return sortTasks(getTasksForDate(selectedDate));
  }, [selectedDate, enrichedTasks, sortBy]);

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

      const data = await response.json();
      await loadTasks();
      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === taskId && data.data) {
        setSelectedTask(data.data);
      }
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

      const data = await response.json();
      await loadTasks();
      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === taskId && data.data) {
        setSelectedTask(data.data);
      }
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

      const data = await response.json();
      setEditingNotes(false);
      setNotesValue('');
      await loadTasks();
      // Update selected task if it's the one being updated
      if (selectedTask && selectedTask.id === taskId && data.data) {
        setSelectedTask(data.data);
      }
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

      setSelectedTask(null);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Format recurrence text
  const formatRecurrence = (recurrence: string, recurrenceDays?: string | null): string => {
    if (recurrence === 'none') return '';
    if (recurrence === 'custom' && recurrenceDays) {
      const days = recurrenceDays.split(',').map(d => d.trim());
      return `Custom (${days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')})`;
    }
    return recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
  };

  // Get allocated by text
  const getAllocatedByText = (task: Task): string => {
    if (task.allocatedByOverride) return task.allocatedByOverride;
    if (task.allocatedByUser) return task.allocatedByUser.username;
    return 'Unassigned';
  };

  // Check if task is overdue
  const isOverdue = (deadline: string, status: string): boolean => {
    if (status === 'completed') return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  // Get unique clients/users for legend (must be before conditional return)
  const uniqueClients = useMemo(() => {
    const clientSet = new Map<string, { name: string; color: string }>();
    
    enrichedTasks.forEach(task => {
      if (task.isCustomMeeting) {
        clientSet.set('custom', { name: 'Custom Meeting', color: '#6b7280' });
        return;
      }
      
      if (task.client) {
        const color = getColorFromId(task.client.id, task.client.color);
        clientSet.set(task.client.id, { name: task.client.name, color });
      } else if (task.allocatedByUser) {
        const color = getColorFromId(task.allocatedByUser.id);
        clientSet.set(task.allocatedByUser.id, { 
          name: task.allocatedByUser.username, 
          color 
        });
      } else if (task.allocatedByOverride) {
        const color = getColorFromId(task.allocatedByOverride);
        clientSet.set(task.allocatedByOverride, { 
          name: task.allocatedByOverride, 
          color 
        });
      }
    });
    
    return Array.from(clientSet.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedTasks]);

  // Debug: Log task counts (must be before conditional return)
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('Total tasks loaded:', tasks.length);
      console.log('Enriched tasks:', enrichedTasks.length);
      console.log('Sample task:', enrichedTasks[0]);
    }
  }, [tasks.length, enrichedTasks.length]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === month && date.getFullYear() === year;
  };

  // Generate calendar days
  const calendarDays: Date[] = [];
  
  // Previous month days
  const prevMonthDays = firstDayOfWeek;
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    calendarDays.push(date);
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }
  
  // Next month days (to fill the grid)
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(new Date(year, month + 1, day));
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-sm md:text-base text-gray-600">
          View your tasks and meetings in a monthly calendar view
        </p>
        {!loading && (
          <p className="text-xs text-gray-500 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} loaded
          </p>
        )}
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

      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium min-h-[44px]"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 ml-2">
            {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        
        {selectedDate && (
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-brand-azure focus:border-brand-azure min-h-[44px]"
            >
              <option value="deadline">Deadline</option>
              <option value="urgency">Urgency</option>
              <option value="client">Client</option>
              <option value="status">Status</option>
            </select>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-7">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && 
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`
                  min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-b border-r border-gray-200
                  cursor-pointer transition-colors
                  ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDate ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                  ${isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : ''}
                  hover:bg-gray-100
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                  ${isTodayDate ? 'text-yellow-700 font-bold' : ''}
                `}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const color = getTaskColor(task);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setNotesValue(task.notes || '');
                          setEditingNotes(false);
                        }}
                        className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: color, color: 'white' }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tasks for {selectedDate.toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {selectedDateTasks.length === 0 ? (
            <p className="text-gray-500">No tasks for this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => {
                const color = getTaskColor(task);
                const clientName = task.client?.name || 
                  task.allocatedByUser?.username || 
                  task.allocatedByOverride || 
                  'Unassigned';

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setNotesValue(task.notes || '');
                      setEditingNotes(false);
                    }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        {task.meetingType && (
                          <span className="text-xs">
                            {task.meetingType === 'call' ? (
                              <Phone className="h-4 w-4 inline text-blue-600" />
                            ) : (
                              <MapPin className="h-4 w-4 inline text-green-600" />
                            )}
                          </span>
                        )}
                      </div>
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                        ${task.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Client:</span> {clientName}
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span>{' '}
                        {new Date(task.deadline).toLocaleDateString('en-GB')}
                      </div>
                      <div>
                        <span className="font-medium">Importance:</span> {task.importance}/5
                      </div>
                      {task.recurrence !== 'none' && (
                        <div>
                          <span className="font-medium">Recurrence:</span> {task.recurrence}
                        </div>
                      )}
                    </div>
                    
                    {task.location && (
                      <div className="mt-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {task.location}
                      </div>
                    )}
                    
                    {task.meetingLink && (
                      <div className="mt-2 text-sm">
                        <a
                          href={task.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <Phone className="h-4 w-4 inline mr-1" />
                          Join Meeting
                        </a>
                      </div>
                    )}
                    
                    {task.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {task.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setEditingNotes(false);
                  setNotesValue('');
                }}
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
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

              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {selectedTask.meetingType === 'call' && <Phone className="h-5 w-5 text-purple-600" />}
                    {selectedTask.meetingType === 'in_person' && <MapPin className="h-5 w-5 text-purple-600" />}
                    {selectedTask.isPersonalTask && <User className="h-5 w-5 text-brand-jade" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {selectedTask.title}
                    </h4>
                    {selectedTask.isCustomMeeting && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded mb-2">
                        Custom Meeting
                      </span>
                    )}
                    {selectedTask.isPersonalTask && (
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
                      selectedTask.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedTask.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedTask.status === 'completed' ? 'Completed' : selectedTask.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                  
                  {/* Overdue Badge */}
                  {isOverdue(selectedTask.deadline, selectedTask.status) && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      Overdue
                    </span>
                  )}
                  
                  {/* Importance Badge */}
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    📢 {selectedTask.importance}/5
                  </span>
                </div>
              </div>

              {/* Allocated By */}
              <div className="mb-3 text-sm text-gray-600">
                <strong>Allocated by:</strong> {getAllocatedByText(selectedTask)}
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="mb-3 text-sm text-gray-700">
                  {selectedTask.description}
                </div>
              )}

              {/* Meeting Details */}
              {selectedTask.meetingType === 'in_person' && selectedTask.location && (
                <div className="mb-3 text-sm text-gray-600">
                  <strong>📍 Location:</strong> {selectedTask.location}
                </div>
              )}
              
              {selectedTask.meetingType === 'call' && selectedTask.meetingLink && (
                <div className="mb-3 text-sm text-gray-600">
                  <strong>📞 Meeting Link:</strong>{' '}
                  <a
                    href={selectedTask.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-azure hover:underline"
                  >
                    {selectedTask.meetingLink}
                  </a>
                </div>
              )}

              {/* Notes Section */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <strong className="text-sm text-gray-700">Notes:</strong>
                  {!editingNotes && (
                    <button
                      onClick={() => {
                        setEditingNotes(true);
                        setNotesValue(selectedTask.notes || '');
                      }}
                      className="text-sm text-brand-azure hover:underline min-h-[44px]"
                    >
                      {selectedTask.notes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  )}
                </div>
                
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNotes(selectedTask.id)}
                        className="px-3 py-1 bg-brand-azure text-white rounded text-sm hover:bg-opacity-90 min-h-[44px]"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(selectedTask.notes || '');
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 min-h-[44px]">
                    {selectedTask.notes || 'No notes'}
                  </div>
                )}
              </div>

              {/* Date Information */}
              <div className="mb-4 text-sm text-gray-600 space-y-1">
                {!selectedTask.isPersonalTask && (
                  <div>
                    <strong>Start Date:</strong> {new Date(selectedTask.startDate).toLocaleDateString('en-GB')}
                  </div>
                )}
                <div>
                  <strong>{selectedTask.isPersonalTask ? 'Date' : 'Deadline'}:</strong>{' '}
                  {new Date(selectedTask.deadline).toLocaleDateString('en-GB')}
                </div>
                {selectedTask.recurrence !== 'none' && (
                  <div>
                    <strong>Recurrence:</strong> {formatRecurrence(selectedTask.recurrence, selectedTask.recurrenceDays)}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
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
                    value={selectedTask.importance}
                    onChange={(e) => handleUpdateImportance(selectedTask.id, parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Color Legend */}
      {uniqueClients.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uniqueClients.map((client, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: client.color }}
                />
                <span className="text-sm text-gray-700">{client.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
