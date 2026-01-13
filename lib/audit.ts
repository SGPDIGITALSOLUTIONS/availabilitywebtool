import { prisma } from './prisma';
import { headers } from 'next/headers';

export interface AuditLogData {
  action: string;
  userId?: string | null;
  username?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an audit event
 * This function should be called from API routes to track user actions
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    // Get IP address and user agent from headers
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      null;
    const userAgent = headersList.get('user-agent') || null;

    await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId || null,
        username: data.username || null,
        details: data.details || null,
        ipAddress: ipAddress || data.ipAddress || null,
        userAgent: userAgent || data.userAgent || null,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main functionality
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Check if a user is an admin
 * For now, we'll check if username is "admin" or starts with "admin"
 * This can be enhanced later with a proper role system
 */
export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return username.toLowerCase() === 'admin' || username.toLowerCase().startsWith('admin');
}
