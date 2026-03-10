import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import { notificationService } from '../../services/notificationService'
import { BellIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatDate'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchAllNotifications()
    }
  }, [user])

  const fetchAllNotifications = async () => {
    try {
      // For now, we'll just get unread ones
      // You might want to add a method to get all notifications
      const notifs = await notificationService.getUserNotifications(user.uid)
      setNotifications(notifs)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(user.uid)
    setNotifications([])
  }

  const handleNotificationClick = (notification) => {
    if (notification.data?.url) {
      navigate(notification.data.url)
    }
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order_update':
        return <CheckCircleIcon className="h-6 w-6 text-blue-500" />
      case 'new_order':
        return <BellIcon className="h-6 w-6 text-green-500" />
      case 'delivery_assignment':
        return <BellIcon className="h-6 w-6 text-orange-500" />
      case 'cycle_complete':
        return <CheckCircleIcon className="h-6 w-6 text-purple-500" />
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-16 text-center">
          <p>Please log in to view notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-xl p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {notification.title || 'Notification'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.body || ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.createdAt, 'medium')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No notifications</p>
                  <p className="text-gray-400 text-sm mt-2">
                    You're all caught up!
                  </p>
                </div>
              )}
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Notifications