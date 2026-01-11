import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function ForecastingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Forecasting
          </h1>
          <p className="text-gray-600 mb-6">
            Forecasting functionality coming soon...
          </p>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Features to be implemented:
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Shift demand forecasting</li>
              <li>Staffing requirement predictions</li>
              <li>Capacity planning</li>
              <li>Trend analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
