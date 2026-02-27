import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { 
  getFirestore, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

console.log('🔥 Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '✅ Present' : '❌ Missing'
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Initialize Firestore with the new cache settings (replaces enableIndexedDbPersistence)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: persistentMultipleTabManager() // Handles multiple tabs
  })
})

const storage = getStorage(app)

// Initialize messaging with proper error handling
let messaging = null

const initializeMessaging = async () => {
  try {
    const supported = await isSupported()
    if (supported) {
      messaging = getMessaging(app)
      console.log('✅ Firebase Messaging initialized')
      
      // Register service worker if needed
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        console.log('✅ Service worker registered:', registration.active ? 'active' : 'inactive')
      }
    } else {
      console.log('ℹ️ Firebase Messaging not supported in this browser')
    }
  } catch (error) {
    console.error('❌ Messaging initialization error:', error)
  }
}

// Call this when app starts
initializeMessaging()

export { auth, db, storage, messaging }
export default app