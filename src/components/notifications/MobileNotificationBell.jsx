import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/notificationService'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

const MobileNotificationBell = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      const userNotifications = await notificationService.getUserNotifications(user.uid)
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    await notificationService.markAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation()
    if (!user) return
    
    try {
      await notificationService.markAllAsRead(user.uid)
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setShowNotifications(false)
    if (notification.data?.url) {
      navigate(notification.data.url)
    }
  }

  // Set up polling for notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  if (!user) return null

  return (
    <>
      {/* Floating Bell Button - Only visible on mobile */}
      <button
        onClick={() => setShowNotifications(true)}
        className="fixed bottom-20 right-4 md:hidden bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal for Mobile */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 md:hidden max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-700">Notifications</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleNotificationClick(notification)}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notification.title || 'Notification'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.body || ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.createdAt, 'relative')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No notifications</p>
                    <p className="text-xs text-gray-400 mt-1">
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileNotificationBell