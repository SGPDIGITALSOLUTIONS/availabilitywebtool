import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CalendarContent } from '@/components/CalendarContent';

export default async function CalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <CalendarContent />
    </main>
  );
}
