'use client';

import { useEffect } from 'react';

export function PWAMetaTags() {
  useEffect(() => {
    // Add manifest link
    if (typeof document !== 'undefined') {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      if (!document.querySelector('link[rel="manifest"]')) {
        document.head.appendChild(manifestLink);
      }

      // Add theme color meta
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        themeColorMeta.setAttribute('content', '#307ABF');
        document.head.appendChild(themeColorMeta);
      }

      // Add favicon link
      let faviconLink = document.querySelector('link[rel="icon"]');
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.setAttribute('rel', 'icon');
        faviconLink.setAttribute('type', 'image/jpeg');
        faviconLink.setAttribute('href', '/assets/Vision_Care_identifier_RGB (2).jpg');
        document.head.appendChild(faviconLink);
      }

      // Add Apple web app meta tags
      const appleMetaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Vision Care Reporting' },
      ];

      appleMetaTags.forEach(({ name, content }) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });
    }
  }, []);

  return null;
}
