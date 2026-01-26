'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Activity, TrendingUp, Menu, X, CheckSquare, Shield, Megaphone, FileSpreadsheet, Calendar } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Check if user is admin (must be before any early returns)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/user/current');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const username = data.user.username?.toLowerCase() || '';
            setIsUserAdmin(username === 'admin' || username.startsWith('admin'));
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

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
          <div className="flex items-center space-x-3 md:space-x-6">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3">
              <div className="h-8 w-auto md:h-10 relative">
                <Image
                  src="/assets/Vision_Care_RGB.gif"
                  alt="Vision Care Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="hidden md:block h-6 w-px bg-gray-300"></div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/forecasting')
                    ? 'bg-brand-turquoise bg-opacity-10 text-brand-turquoise'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span>Forecasting</span>
              </Link>
              
              <Link
                href="/tasks"
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/tasks')
                    ? 'bg-brand-jade bg-opacity-10 text-brand-jade'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckSquare className="h-5 w-5" />
                <span>Steve Task List</span>
              </Link>
              
              <Link
                href="/calendar"
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/calendar')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </Link>
              
              <Link
                href="/productivity"
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/productivity')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span>Productivity</span>
              </Link>
              
              {isUserAdmin && (
                <>
                  <Link
                    href="/audit"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      isActive('/audit')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Audit Log</span>
                  </Link>
                  <Link
                    href="/admin/updates"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      isActive('/admin/updates')
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Megaphone className="h-5 w-5" />
                    <span>App Updates</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
                isActive('/forecasting')
                  ? 'bg-brand-turquoise bg-opacity-10 text-brand-turquoise'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Forecasting</span>
            </Link>
            
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
                isActive('/tasks')
                  ? 'bg-brand-jade bg-opacity-10 text-brand-jade'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CheckSquare className="h-5 w-5" />
              <span>Steve Task List</span>
            </Link>
            
            <Link
              href="/calendar"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
                isActive('/calendar')
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Calendar</span>
            </Link>
            
            <Link
              href="/productivity"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
                isActive('/productivity')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span>Productivity</span>
            </Link>
            
            {isUserAdmin && (
              <>
                <Link
                  href="/audit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] mb-2 ${
                    isActive('/audit')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Audit Log</span>
                </Link>
                <Link
                  href="/admin/updates"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] ${
                    isActive('/admin/updates')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Megaphone className="h-5 w-5" />
                  <span>App Updates</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
