import React, { useEffect } from 'react'
import toast from 'react-hot-toast'

const NotificationToast = () => {
  useEffect(() => {
    // Listen for notification events from the service
    const handleNotification = (event) => {
      const { title, body, data } = event.detail
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src="/icon-192.png" alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{title || 'Notification'}</p>
                <p className="mt-1 text-sm text-gray-500">{body || ''}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 })
    }

    window.addEventListener('notification-received', handleNotification)
    
    return () => {
      window.removeEventListener('notification-received', handleNotification)
    }
  }, [])

  return null
}

export default NotificationToast