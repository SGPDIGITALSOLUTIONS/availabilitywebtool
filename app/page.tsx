import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { Activity, TrendingUp, ArrowRight, CheckSquare } from 'lucide-react';
import { AppUpdates } from '@/components/AppUpdates';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Vision Care Reporting
          </h1>
          <p className="text-base md:text-xl text-gray-600">
            Manage clinic availability and forecasting in one place
          </p>
        </div>

        {/* App Updates */}
        <AppUpdates />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Clinic Availability Dashboard Card */}
          <Link
            href="/dashboard"
            className="group bg-white rounded-lg shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-brand-azure min-h-[44px]"
          >
            <div className="flex items-center space-x-3 md:space-x-4 mb-4">
              <div className="bg-brand-azure bg-opacity-10 p-2 md:p-3 rounded-lg">
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-brand-azure" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Clinic Availability Dashboard
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
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
            className="group bg-white rounded-lg shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-brand-turquoise min-h-[44px]"
          >
            <div className="flex items-center space-x-3 md:space-x-4 mb-4">
              <div className="bg-brand-turquoise bg-opacity-10 p-2 md:p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-brand-turquoise" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Forecasting
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Analyze trends, predict staffing needs, and plan capacity for future clinic operations.
            </p>
            <div className="flex items-center text-brand-turquoise font-medium group-hover:translate-x-2 transition-transform">
              <span>View Forecasting</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>

          {/* Steve Task List Card */}
          <Link
            href="/tasks"
            className="group bg-white rounded-lg shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-brand-jade min-h-[44px]"
          >
            <div className="flex items-center space-x-3 md:space-x-4 mb-4">
              <div className="bg-brand-jade bg-opacity-10 p-2 md:p-3 rounded-lg">
                <CheckSquare className="h-6 w-6 md:h-8 md:w-8 text-brand-jade" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Steve Task List
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Manage tasks, meetings, and personal items with smart prioritization and tracking.
            </p>
            <div className="flex items-center text-brand-jade font-medium group-hover:translate-x-2 transition-transform">
              <span>View Task List</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
