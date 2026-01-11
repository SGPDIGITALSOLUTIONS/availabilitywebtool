'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Activity, TrendingUp } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  
  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-auto relative">
                <Image
                  src="/assets/Vision_Care_RGB.gif"
                  alt="Vision Care Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-brand-azure bg-opacity-10 text-brand-azure'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Clinic Availability Dashboard</span>
            </Link>
            
            <Link
              href="/forecasting"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/forecasting')
                  ? 'bg-brand-turquoise bg-opacity-10 text-brand-turquoise'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Forecasting</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
