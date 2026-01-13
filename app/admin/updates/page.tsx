import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/audit';
import { ManageAppUpdates } from '@/components/ManageAppUpdates';

export default async function AdminUpdatesPage() {
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
      <ManageAppUpdates />
    </main>
  );
}
