import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/audit';
import { AuditLogContent } from '@/components/AuditLogContent';

export default async function AuditPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  if (!isAdmin(user.username)) {
    redirect('/');
  }

  return (
    <main>
      <AuditLogContent />
    </main>
  );
}
