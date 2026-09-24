/* GrowthDialer Web Push service worker — inbound call notifications. */
self.addEventListener('push', (event) => {
  let title = 'Incoming call';
  let body = 'Incoming call';
  let url = '/incoming';
  try {
    const data = event.data ? event.data.json() : {};
    if (data.title) title = String(data.title);
    if (data.body) body = String(data.body);
    if (data.url) url = String(data.url);
  } catch {
    // Use defaults.
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'gd-incoming-call',
      renotify: true,
      requireInteraction: true,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/incoming';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
