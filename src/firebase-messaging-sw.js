// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyAvdpjx1YccTHqji2XpwZJX2THnoaXmcOg",
  authDomain: "asistencia-vehicular-890e2.firebaseapp.com",
  projectId: "asistencia-vehicular-890e2",
  storageBucket: "asistencia-vehicular-890e2.firebasestorage.app",
  messagingSenderId: "770812655534",
  appId: "1:770812655534:web:66a5392e14282547623a3f"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages from Firebase
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle push events (for DevTools testing and non-Firebase pushes)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  let notificationData = {
    title: 'Notificación de Prueba',
    body: 'Mensaje de prueba desde el Service Worker',
    icon: '/icon.png'
  };

  // Try to parse the push data if it exists
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[firebase-messaging-sw.js] Push data:', data);
      notificationData = {
        title: data.notification?.title || data.title || notificationData.title,
        body: data.notification?.body || data.body || notificationData.body,
        icon: data.notification?.icon || data.icon || notificationData.icon,
        data: data.data
      };
    } catch (e) {
      // If parsing fails, try to get text
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      data: notificationData.data
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is open, focus it
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
