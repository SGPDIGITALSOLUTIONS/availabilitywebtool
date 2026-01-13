'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Save, AlertCircle } from 'lucide-react';

interface AppUpdate {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdByUsername?: string | null;
}

export function ManageAppUpdates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    expiresAt: '',
  });

  const loadUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all updates (including inactive) for admin
      const response = await fetch('/api/app-updates?includeInactive=true');
      const data = await response.json();
      
      if (data.success) {
        setUpdates(data.data || []);
      } else {
        setError(data.error || 'Failed to load updates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingId 
        ? `/api/app-updates/${editingId}`
        : '/api/app-updates';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const payload: any = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
      };

      if (formData.expiresAt) {
        payload.expiresAt = formData.expiresAt;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save update');
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        expiresAt: '',
      });
      setShowForm(false);
      setEditingId(null);
      loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update');
    }
  };

  const handleEdit = (update: AppUpdate) => {
    setFormData({
      title: update.title,
      content: update.content,
      priority: update.priority,
      expiresAt: update.expiresAt ? new Date(update.expiresAt).toISOString().split('T')[0] : '',
    });
    setEditingId(update.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      const response = await fetch(`/api/app-updates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete update');
      }

      loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete update');
    }
  };

  const handleToggleActive = async (update: AppUpdate) => {
    try {
      const response = await fetch(`/api/app-updates/${update.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !update.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Manage App Updates
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Create and manage app updates that appear on users' home pages
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                title: '',
                content: '',
                priority: 'normal',
                expiresAt: '',
              });
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-azure text-white rounded-lg hover:bg-opacity-90 transition-colors min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>New Update</span>
          </button>
        </div>
      </div>

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

      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit Update' : 'Create New Update'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  title: '',
                  content: '',
                  priority: 'normal',
                  expiresAt: '',
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At (optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-azure min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-brand-azure text-white rounded-md hover:bg-opacity-90 min-h-[44px]"
              >
                <Save className="h-4 w-4" />
                <span>{editingId ? 'Update' : 'Create'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    content: '',
                    priority: 'normal',
                    expiresAt: '',
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading updates...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No updates found. Create your first update above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 ${
                !update.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{update.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      update.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      update.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      update.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {update.priority}
                    </span>
                    {!update.isActive && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    {update.content}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(update.createdAt).toLocaleString()}
                    {update.expiresAt && (
                      <> • Expires: {new Date(update.expiresAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(update)}
                    className={`px-3 py-1 rounded text-sm min-h-[44px] ${
                      update.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {update.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(update)}
                    className="p-2 text-brand-azure hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
