'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navigation() {
  const pathname = usePathname();

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
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
        </div>
      </div>
    </nav>
  );
}
