'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Tablet } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect device type with better detection
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const platform = navigator.platform || '';
      
      // Check for iPad (iOS 13+)
      const isIPad = /iPad/.test(userAgent) || 
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Check for iPhone/iPod
      const isIPhone = /iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      
      if (isIPad || isIPhone) {
        return 'ios';
      }
      
      // Check for Android
      if (/android/i.test(userAgent)) {
        // Check if it's a tablet
        if (/tablet|playbook|silk/i.test(userAgent) || (window.innerWidth >= 768)) {
          return 'android';
        }
        return 'android';
      }
      
      // Check for desktop
      if (/Mac|Windows|Linux/.test(platform) || /Mac|Win|Linux/.test(userAgent)) {
        return 'desktop';
      }
      
      return 'unknown';
    };

    const detectedDevice = detectDevice();
    setDeviceType(detectedDevice);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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

    // Show prompt after a delay (for all devices)
    // iOS doesn't have beforeinstallprompt, so always show instructions
    // Android/Desktop will show install button if available, otherwise instructions
    const showPromptTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(showPromptTimer);
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

  // Don't show if already installed
  if (isInstalled || !showPrompt) {
    return null;
  }

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          icon: <Smartphone className="h-6 w-6" />,
          title: 'Install on iPhone/iPad',
          steps: [
            'Tap the Share button (square with arrow) at the bottom of Safari',
            'Scroll down in the share menu and tap "Add to Home Screen"',
            'Tap "Add" in the top right corner to confirm',
            'The app will appear on your home screen like a native app'
          ],
          browser: 'Safari'
        };
      case 'android':
        return {
          icon: <Smartphone className="h-6 w-6" />,
          title: 'Install on Android',
          steps: [
            'Tap the menu button (three dots) in the top right of Chrome',
            'Select "Install app" or "Add to Home screen"',
            'Tap "Install" in the popup to confirm',
            'The app will be added to your home screen and app drawer'
          ],
          browser: 'Chrome'
        };
      case 'desktop':
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        let browser = 'your browser';
        let steps = [];
        
        if (isChrome || isEdge) {
          browser = 'Chrome/Edge';
          steps = [
            'Look for the install icon (⊕) in the address bar on the right',
            'Click it and select "Install" in the popup',
            'Or go to Menu (three dots) > "Install Vision Care Reporting..."',
            'The app will open in its own window like a desktop app'
          ];
        } else if (isFirefox) {
          browser = 'Firefox';
          steps = [
            'Click the menu button (three lines) in the top right',
            'Select "More tools" > "Use this site as an app"',
            'Click "Install" in the popup',
            'The app will be added to your applications'
          ];
        } else if (isSafari) {
          browser = 'Safari';
          steps = [
            'Click "File" in the menu bar',
            'Select "Add to Dock" or "Add to Home Screen"',
            'The app will appear in your Dock or Launchpad'
          ];
        } else {
          steps = [
            'Look for the install option in your browser\'s menu',
            'Check your browser\'s help for "Install web app" or "Add to Home Screen"',
            'Follow your browser\'s specific installation instructions'
          ];
        }
        
        return {
          icon: <Monitor className="h-6 w-6" />,
          title: `Install on Desktop (${browser})`,
          steps,
          browser
        };
      default:
        return {
          icon: <Download className="h-6 w-6" />,
          title: 'Install App',
          steps: [
            'Look for the install option in your browser',
            'Check your browser menu for "Install" or "Add to Home Screen"',
            'Follow your browser\'s installation instructions'
          ],
          browser: 'your browser'
        };
    }
  };

  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up max-h-[90vh] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-brand-azure p-4 md:p-6">
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

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Install this app on your {deviceType === 'desktop' ? 'computer' : deviceType === 'ios' ? 'iPhone/iPad' : 'Android device'} for a better experience and offline access.
          </p>
          
          {deferredPrompt && (
            // Show install button for browsers that support beforeinstallprompt
            <button
              onClick={handleInstallClick}
              className="w-full bg-brand-azure text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center space-x-2 mb-3"
            >
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </button>
          )}
          
          {/* Always show device-specific instructions */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {deviceType === 'ios' ? 'Safari Instructions' : deviceType === 'android' ? 'Chrome Instructions' : `${instructions.browser} Instructions`}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {instructions.steps.map((step, index) => (
                <li key={index} className="pl-2 leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </div>

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
