import React from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../ui/GlassCard'
import Button from '../ui/Button'
import { ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatCurrency } from '../../utils/formatDate' // Use formatCurrency instead of $
import { ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'

// Status color mapping - simplified and direct
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-pink-100 text-pink-800',
  on_the_way: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const OrderCard = ({ order, onViewDetails, onUpdateStatus, userRole }) => {
  // Get status color based on order status
  const getStatusBadge = () => {
    return STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
  }

  // Safe ID display
  const displayId = order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')

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
                Order #{displayId}
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
                  <span className="truncate max-w-xs">{order.deliveryAddress}</span>
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
                {formatCurrency(order.total)}
              </p>
              <p className="text-xs text-gray-500">
                {order.items?.length || 0} items
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
              
              {/* Show Update Status button for admin/delivery roles */}
              {onUpdateStatus && (userRole === 'admin' || userRole === 'delivery') && (
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