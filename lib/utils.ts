import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastUpdated(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'operational':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'limited':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'non-functional':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'error':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'operational':
      return '🟢';
    case 'limited':
      return '🟡';
    case 'non-functional':
      return '🔴';
    case 'error':
      return '⚠️';
    default:
      return '❓';
  }
}

export function formatStaffingLevel(total: number): string {
  if (total === 0) return 'No staff';
  if (total <= 2) return 'Minimal staff';
  if (total <= 5) return 'Limited staff';
  if (total <= 10) return 'Good staffing';
  return 'Full staff';
} 