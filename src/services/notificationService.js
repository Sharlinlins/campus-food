import { messaging } from './firebase'
import { getToken, onMessage, isSupported } from 'firebase/messaging'
import { db } from './firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

export const notificationService = {
  // Check if messaging is available
  async isMessagingSupported() {
    try {
      if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser')
        return false
      }
      
      if (!messaging) {
        console.log('Firebase Messaging not initialized')
        return false
      }
      
      const supported = await isSupported().catch(() => false)
      return supported
    } catch (error) {
      console.error('Error checking messaging support:', error)
      return false
    }
  },

  // Request permission and get token
  async requestPermission(userId) {
    try {
      console.log('🔔 Requesting notification permission...')
      
      // Check if supported
      const supported = await this.isMessagingSupported()
      if (!supported) {
        return { 
          granted: false, 
          error: 'not_supported',
          message: 'Notifications are not supported in this browser'
        }
      }

      // Check current permission
      const permission = Notification.permission
      console.log('Current permission:', permission)

      if (permission === 'denied') {
        return { 
          granted: false, 
          error: 'denied',
          message: 'Notifications are blocked. Click the lock icon in the address bar and enable notifications.'
        }
      }

      if (permission === 'granted') {
        const token = await this.getFCMToken(userId)
        return { granted: true, token }
      }

      // Request permission
      const newPermission = await Notification.requestPermission()
      console.log('New permission:', newPermission)

      if (newPermission === 'granted') {
        const token = await this.getFCMToken(userId)
        return { granted: true, token }
      }

      return { 
        granted: false, 
        error: 'denied_by_user',
        message: 'You denied notification permission. You can enable them later in browser settings.'
      }

    } catch (error) {
      console.error('Permission request error:', error)
      return { 
        granted: false, 
        error: error.message,
        message: 'Failed to request notification permission'
      }
    }
  },

  // Get FCM token with retry logic
  async getFCMToken(userId) {
    try {
      if (!messaging) {
        console.log('Messaging not available')
        return null
      }

      console.log('Getting FCM token...')
      
      // Check if we have VAPID key
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        console.error('VAPID key is missing. Add VITE_FIREBASE_VAPID_KEY to your .env file')
        return null
      }

      // Try to get token with retry logic
      let token = null
      let retries = 3
      
      while (retries > 0 && !token) {
        try {
          token = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          })
          break
        } catch (err) {
          console.log(`Token attempt failed (${retries} retries left):`, err.message)
          retries--
          if (retries === 0) throw err
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (token) {
        console.log('✅ FCM token obtained successfully')
        // Save token if user is logged in
        if (userId) {
          await this.saveUserToken(userId, token)
        }
        return token
      } else {
        console.log('No registration token available')
        return null
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      
      // Provide specific error messages
      if (error.code === 'messaging/permission-blocked') {
        console.error('Notification permission was blocked. User needs to manually enable it.')
      } else if (error.name === 'AbortError' || error.message?.includes('permission denied')) {
        console.error('Permission denied. Please check browser notification settings.')
      }
      
      return null
    }
  },

  // Save token to Firestore
  async saveUserToken(userId, token) {
    try {
      if (!userId || !token) return
      
      console.log('Saving token for user:', userId)
      
      // Check if token already exists
      const q = query(
        collection(db, 'notificationTokens'),
        where('userId', '==', userId),
        where('token', '==', token)
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'notificationTokens'), {
          userId,
          token,
          createdAt: serverTimestamp(),
          lastUsed: serverTimestamp(),
          device: this.getDeviceInfo(),
          userAgent: navigator.userAgent,
          browser: this.getBrowserInfo()
        })
        console.log('✅ Token saved successfully')
      } else {
        // Update existing token's timestamp
        const docRef = snapshot.docs[0].ref
        await updateDoc(docRef, {
          lastUsed: serverTimestamp()
        })
        console.log('✅ Token already exists, updated timestamp')
      }
    } catch (error) {
      console.error('Error saving token:', error)
    }
  },

  // Get device info
  getDeviceInfo() {
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet'
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile'
    }
    return 'desktop'
  },

  // Get browser info
  getBrowserInfo() {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'chrome'
    if (ua.includes('Firefox')) return 'firefox'
    if (ua.includes('Safari')) return 'safari'
    if (ua.includes('Edge')) return 'edge'
    return 'unknown'
  },

  // Set up foreground message listener
  setupForegroundListener() {
    if (!messaging) return

    onMessage(messaging, (payload) => {
      console.log('📨 Foreground message received:', payload)
      
      const { title, body } = payload.notification || {}
      const data = payload.data || {}
      
      // Dispatch a custom event that React components can listen to
      const event = new CustomEvent('notification-received', {
        detail: { title, body, data }
      })
      window.dispatchEvent(event)
    })
  },

  // Create a notification for a user
  async createNotification(userId, notification) {
    try {
      const notifData = {
        userId,
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'notifications'), notifData)
      console.log('✅ Notification created for user:', userId)
      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  },

  // Get user's notifications
  async getUserNotifications(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  },

  // Get permission status with helpful message
  getPermissionStatus() {
    const permission = Notification.permission
    const supported = 'Notification' in window
    
    let message = ''
    if (!supported) {
      message = 'Notifications are not supported in this browser'
    } else if (permission === 'denied') {
      message = 'Notifications are blocked. Click the lock icon in the address bar and enable notifications.'
    } else if (permission === 'granted') {
      message = 'Notifications are enabled'
    } else {
      message = 'Notifications permission not requested yet'
    }

    return {
      permission,
      supported,
      canPrompt: permission === 'default',
      message
    }
  },

  // Reset notification state (call this when user wants to try again)
  async resetAndRequestPermission(userId) {
    // Clear any stored permissions in Firebase
    if (userId) {
      const q = query(
        collection(db, 'notificationTokens'),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref).catch(() => {})
      )
      await Promise.all(deletePromises)
    }
    
    // Request permission again
    return this.requestPermission(userId)
  }
}