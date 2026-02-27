// Use compatible Firebase versions
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Your Firebase configuration - copy from your .env
firebase.initializeApp({
  apiKey: "AIzaSyB5LovxIFL6CNYvD_PXP0ed12c3i8Qk0us",
  authDomain: "foodie-6bf63.firebaseapp.com",
  projectId: "foodie-6bf63",
  storageBucket: "foodie-6bf63.firebasestorage.app",
  messagingSenderId: "957132100428",
  appId: "1:957132100428:web:3d08f86c1333bd814c35e9"
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 [SW] Background message received:', payload)
  
  const notificationTitle = payload.notification?.title || 'New Notification'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'View'
      }
    ]
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification)
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(urlToOpen)
      })
  )
})