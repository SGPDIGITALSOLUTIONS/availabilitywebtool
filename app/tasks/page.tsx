import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { TaskListContent } from '@/components/TaskListContent';

export default async function TasksPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <TaskListContent />
    </main>
  );
}
