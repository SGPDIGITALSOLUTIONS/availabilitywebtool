'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface AppUpdate {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  createdByUsername?: string | null;
}

export function AppUpdates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedUpdates, setDismissedUpdates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const response = await fetch('/api/app-updates');
        const data = await response.json();
        
        if (data.success) {
          setUpdates(data.data || []);
        }
      } catch (error) {
        console.error('Error loading app updates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpdates();

    // Load dismissed updates from localStorage
    const dismissed = localStorage.getItem('dismissedAppUpdates');
    if (dismissed) {
      try {
        setDismissedUpdates(new Set(JSON.parse(dismissed)));
      } catch (e) {
        console.error('Error parsing dismissed updates:', e);
      }
    }
  }, []);

  const handleDismiss = (updateId: string) => {
    const newDismissed = new Set(dismissedUpdates);
    newDismissed.add(updateId);
    setDismissedUpdates(newDismissed);
    localStorage.setItem('dismissedAppUpdates', JSON.stringify(Array.from(newDismissed)));
  };

  if (loading) {
    return null;
  }

  const visibleUpdates = updates.filter(update => !dismissedUpdates.has(update.id));

  if (visibleUpdates.length === 0) {
    return null;
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          text: 'text-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-500',
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-400',
          text: 'text-orange-800',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-500',
        };
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-400',
          text: 'text-amber-800',
          icon: CheckCircle,
          iconColor: 'text-amber-500',
        };
    }
  };

  return (
    <div className="mb-6 md:mb-8 space-y-4">
      {visibleUpdates.map((update) => {
        const styles = getPriorityStyles(update.priority);
        const Icon = styles.icon;
        
        return (
          <div
            key={update.id}
            className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Icon className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-1`}>
                    {update.title}
                  </h3>
                  <div className={`text-sm ${styles.text} whitespace-pre-wrap`}>
                    {update.content}
                  </div>
                  {update.createdByUsername && (
                    <p className="text-xs text-gray-500 mt-2">
                      Posted by {update.createdByUsername} • {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(update.id)}
                className={`ml-4 ${styles.text} hover:opacity-70 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center`}
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
