'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="text-center text-sm text-gray-600">
          <p>
            Created by{' '}
            <a
              href="https://www.sgpdigitalsolutions.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-azure hover:text-brand-turquoise hover:underline transition-colors font-medium"
            >
              SGP Digital Solutions LTD
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
