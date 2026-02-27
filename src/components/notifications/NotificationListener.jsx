import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/notificationService'
import NotificationToast from './NotificationToast'
import { BellIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/outline'
import {motion, AnimatePresence } from 'framer-motion'

const NotificationListener = () => {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use useCallback to memoize functions
  const fetchUserNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      const userNotifications = await notificationService.getUserNotifications(user.uid)
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user])

  const initializeNotifications = useCallback(async () => {
    setIsLoading(true)
    const { granted, error, message } = await notificationService.requestPermission(user?.uid)
    
    if (granted) {
      console.log('Notifications initialized successfully')
      await fetchUserNotifications()
      setShowPrompt(false)
      setBlockedMessage('')
    } else if (error === 'denied') {
      setBlockedMessage(message)
    }
    setIsLoading(false)
  }, [user, fetchUserNotifications])

  const checkPermissionAndInitialize = useCallback(async () => {
    const status = notificationService.getPermissionStatus()
    
    if (status.permission === 'granted') {
      await initializeNotifications()
    } else if (status.permission === 'default') {
      setShowPrompt(true)
    } else if (status.permission === 'denied') {
      setBlockedMessage(status.message)
    }
  }, [initializeNotifications])

  // Use useEffect with proper dependencies and conditions
  useEffect(() => {
    let isMounted = true
    let intervalId = null

    const setupNotifications = async () => {
      if (!user || !isMounted) return
      await checkPermissionAndInitialize()
    }

    setupNotifications()

    // Set up interval only if needed
    if (user) {
      intervalId = setInterval(() => {
        if (isMounted) {
          fetchUserNotifications()
        }
      }, 30000)
    }

    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user, checkPermissionAndInitialize, fetchUserNotifications]) // Add all dependencies

  const handleEnableNotifications = async () => {
    await initializeNotifications()
  }

  const handleResetAndTryAgain = async () => {
    setIsLoading(true)
    setBlockedMessage('')
    const { granted, message } = await notificationService.resetAndRequestPermission(user?.uid)
    if (!granted) {
      setBlockedMessage(message)
    }
    setIsLoading(false)
  }

  const handleMarkAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  if (!user) return null

  return (
    <>
      <NotificationToast />

      {/* Notification Prompt */}
      <AnimatePresence>
        {showPrompt && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
          >
            <div className="bg-white rounded-lg shadow-xl border border-blue-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Enable Notifications</span>
                </div>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Get real-time updates about your orders, delivery status, and special offers!
                </p>
                <button
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Enabling...' : 'Enable Notifications'}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Notification Message */}
      <AnimatePresence>
        {blockedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
          >
            <div className="bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellIcon className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Notifications Blocked</span>
                </div>
                <button
                  onClick={() => setBlockedMessage('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {blockedMessage}
                </p>
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 mb-3">
                  <p className="font-medium mb-1">How to enable:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the lock icon in the address bar</li>
                    <li>Find "Notifications" in the permissions list</li>
                    <li>Change from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
                <button
                  onClick={handleResetAndTryAgain}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Checking...' : 'I\'ve enabled them, try again'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-app Notifications Bell */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        >
          <BellIcon className="h-6 w-6" />
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Notifications dropdown */}
        <AnimatePresence>
          {showNotifications && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-semibold text-gray-700">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border-b hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-800">{notif.title || 'Notification'}</p>
                    <p className="text-xs text-gray-600 mt-1">{notif.body || ''}</p>
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs text-primary-600 mt-2 hover:underline"
                    >
                      Mark as read
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default NotificationListener