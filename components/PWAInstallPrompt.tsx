'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Download, Smartphone, Monitor, Tablet } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Don't show on login page
    if (pathname === '/login') {
      setShowPrompt(false);
      return;
    }
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        return 'ios';
      }
      if (/android/i.test(userAgent)) {
        return 'android';
      }
      if (/Mac|Windows|Linux/.test(userAgent)) {
        return 'desktop';
      }
      return 'unknown';
    };

    setDeviceType(detectDevice());

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };

    checkInstalled();

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if user dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Don't show on login page or if already installed
  if (pathname === '/login' || isInstalled || !showPrompt) {
    return null;
  }

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          icon: <Smartphone className="h-6 w-6" />,
          title: 'Install on iOS',
          steps: [
            'Tap the Share button',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to confirm'
          ]
        };
      case 'android':
        return {
          icon: <Smartphone className="h-6 w-6" />,
          title: 'Install on Android',
          steps: [
            'Tap the menu button (three dots)',
            'Select "Install app" or "Add to Home screen"',
            'Confirm installation'
          ]
        };
      case 'desktop':
        return {
          icon: <Monitor className="h-6 w-6" />,
          title: 'Install on Desktop',
          steps: [
            'Click the install icon in your browser address bar',
            'Or use the browser menu: More tools > Create shortcut',
            'Check "Open as window" for app-like experience'
          ]
        };
      default:
        return {
          icon: <Download className="h-6 w-6" />,
          title: 'Install App',
          steps: [
            'Look for the install option in your browser',
            'Follow your browser\'s installation instructions'
          ]
        };
    }
  };

  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-brand-azure p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-azure bg-opacity-10 p-2 rounded-lg">
              {instructions.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {instructions.title}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {deferredPrompt ? (
          // Show install button for browsers that support beforeinstallprompt
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Install this app on your device for a better experience and offline access.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full bg-brand-azure text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </button>
          </div>
        ) : (
          // Show manual instructions for iOS or unsupported browsers
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              Follow these steps to install:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {instructions.steps.map((step, index) => (
                <li key={index} className="pl-2">{step}</li>
              ))}
            </ol>
          </div>
        )}

        <button
          onClick={handleDismiss}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
