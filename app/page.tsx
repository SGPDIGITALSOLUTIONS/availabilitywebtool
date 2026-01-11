import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { Activity, TrendingUp, ArrowRight } from 'lucide-react';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vision Care Reporting
          </h1>
          <p className="text-xl text-gray-600">
            Manage clinic availability and forecasting in one place
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Clinic Availability Dashboard Card */}
          <Link
            href="/dashboard"
            className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-brand-azure"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-brand-azure bg-opacity-10 p-3 rounded-lg">
                <Activity className="h-8 w-8 text-brand-azure" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Clinic Availability Dashboard
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              View real-time clinic availability, staffing levels, and shift schedules across all locations.
            </p>
            <div className="flex items-center text-brand-azure font-medium group-hover:translate-x-2 transition-transform">
              <span>View Dashboard</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>

          {/* Forecasting Card */}
          <Link
            href="/forecasting"
            className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-brand-turquoise"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-brand-turquoise bg-opacity-10 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-brand-turquoise" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Forecasting
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Analyze trends, predict staffing needs, and plan capacity for future clinic operations.
            </p>
            <div className="flex items-center text-brand-turquoise font-medium group-hover:translate-x-2 transition-transform">
              <span>View Forecasting</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
