// This service worker is designed to automatically unregister itself and remove any
// old, misconfigured versions from users' browsers. This is a one-time cleanup.
self.addEventListener('install', () => {
  // Skip the waiting phase and activate immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // On activation, unregister this service worker.
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => {
        // After unregistering, get all client windows controlled by this service worker.
        return self.clients.matchAll();
      })
      .then((clients) => {
        // Reload all clients to ensure they fetch the latest content from the server,
        // free from service worker interference.
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
