import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/notificationService'
import { BellIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

const NotificationBell = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
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
    setShowDropdown(false)
    if (notification.data?.url) {
      navigate(notification.data.url)
    }
  }

  // Set up polling for notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order_update':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'new_order':
        return <BellIcon className="h-5 w-5 text-green-500" />
      case 'delivery_assignment':
        return <BellIcon className="h-5 w-5 text-orange-500" />
      case 'cycle_complete':
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {notification.title || 'Notification'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.body || ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.createdAt, 'relative')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <BellIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 px-4 py-2 border-t text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowDropdown(false)}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell