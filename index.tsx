import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Dynamically generate and inject the PWA manifest
async function setupManifest() {
  try {
    const response = await fetch('/metadata.json');
    if (!response.ok) {
      throw new Error('Failed to fetch metadata.json');
    }
    const metadata = await response.json();

    const manifest = {
      name: metadata.name || 'AI Ad Generator',
      short_name: 'AI Ad Gen',
      description: metadata.description || 'Generate stunning ads with AI.',
      start_url: '/',
      display: 'standalone',
      background_color: '#111827',
      theme_color: '#111827',
      icons: [
        {
          src: '/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/maskable_icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable',
        },
      ],
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);
    console.log('Manifest dynamically generated and linked.');
  } catch (error) {
    console.error('Failed to setup dynamic manifest:', error);
  }
}

setupManifest();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);