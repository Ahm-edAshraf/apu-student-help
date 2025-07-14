const CACHE_NAME = 'apu-study-hub-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/login',
  '/tasks',
  '/vault',
  '/braincell',
  '/timetable',
  '/study-tracker',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker: Skip waiting')
        self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Claiming clients')
        self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) return

  // Skip API requests for real-time data
  if (event.request.url.includes('/api/')) {
    // For API requests, try network first, then show offline message
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({
              error: 'You appear to be offline. Please check your connection.',
              offline: true
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline, serve cached version or offline page
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline page for uncached routes
              return caches.match('/')
            })
        })
    )
    return
  }

  // For other requests (CSS, JS, images, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse
        }
        
        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Return a fallback for images
            if (event.request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#6b7280">Image unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              )
            }
            throw error
          })
      })
  )
})

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync any pending data when connection is restored
      syncPendingData()
    )
  }
})

async function syncPendingData() {
  try {
    // Check if there's any pending data to sync
    const pendingData = await getPendingData()
    
    if (pendingData.length > 0) {
      console.log('Service Worker: Syncing pending data', pendingData.length, 'items')
      
      // Process each pending item
      for (const item of pendingData) {
        try {
          await fetch(item.url, item.options)
          await removePendingData(item.id)
        } catch (error) {
          console.log('Service Worker: Failed to sync item', item.id, error)
        }
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error)
  }
}

// Helper functions for managing pending data
async function getPendingData() {
  // This would typically use IndexedDB to store pending requests
  // For now, return empty array
  return []
}

async function removePendingData(id) {
  // Remove synced item from storage
  console.log('Service Worker: Removed pending data item', id)
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received')
  
  const options = {
    body: 'You have new notifications in APU Study Hub',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('APU Study Hub', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else {
    // Default action
    event.waitUntil(
      clients.openWindow('/')
    )
  }
}) 