import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProductivityReports } from '@/components/ProductivityReports';

export default async function ProductivityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <ProductivityReports />
    </main>
  );
}
