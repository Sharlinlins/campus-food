import React from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../ui/GlassCard'
import Button from '../ui/Button'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'
import { ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'

const OrderCard = ({ order, onViewDetails, onUpdateStatus, userRole }) => {
  const statusColor = ORDER_STATUS_COLORS[order.status] || 'gray'
  
  const getStatusBadge = () => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800'
    }
    
    return colors[statusColor] || 'bg-gray-100 text-gray-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <GlassCard className="hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Order #{order.id.slice(-8)}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge()}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {formatDate(order.createdAt, 'relative')}
              </p>
              
              {order.deliveryAddress && (
                <p className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  {order.deliveryAddress}
                </p>
              )}
              
              {order.userName && (
                <p className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {order.userName}
                </p>
              )}
            </div>

            {/* Items Preview */}
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
              <div className="flex flex-wrap gap-2">
                {order.items?.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {item.quantity}x {item.name}
                  </span>
                ))}
                {order.items?.length > 3 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">
                ${order.total?.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {order.items?.length} items
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(order)}
              >
                View Details
              </Button>
              
              {onUpdateStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus(order)}
                >
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default OrderCard