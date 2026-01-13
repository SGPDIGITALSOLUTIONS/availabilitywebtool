import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ForecastingDashboard } from '@/components/ForecastingDashboard';

export default async function ForecastingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <ForecastingDashboard />
    </main>
  );
}
