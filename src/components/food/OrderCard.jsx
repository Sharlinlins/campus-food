import React from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../ui/GlassCard'
import Button from '../ui/Button'
import { ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatCurrency } from '../../utils/formatDate'
import { ClockIcon, MapPinIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline'

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
  const getStatusBadge = () => {
    return STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
  }

  const displayId = order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')

  const formatPhoneDisplay = (phone) => {
    if (!phone) return 'Not provided'
    if (phone.startsWith('+91')) return phone
    if (/^\d{10}$/.test(phone)) {
      return `+91 ${phone.slice(0,5)} ${phone.slice(5)}`
    }
    return phone
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <GlassCard className="p-3 md:p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">
                Order #{displayId}
              </h3>
              <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${getStatusBadge()}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="space-y-1 text-[10px] md:text-xs lg:text-sm text-gray-600">
              <p className="flex items-center gap-1 md:gap-2">
                <ClockIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">{formatDate(order.createdAt, 'relative')}</span>
              </p>
              
              {order.userName && (
                <p className="flex items-center gap-1 md:gap-2">
                  <UserIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate">{order.userName}</span>
                </p>
              )}
              
              <p className="flex items-center gap-1 md:gap-2">
                <PhoneIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate text-[10px] md:text-xs">{formatPhoneDisplay(order.userPhone)}</span>
              </p>
              
              {order.deliveryAddress && (
                <p className="flex items-center gap-1 md:gap-2">
                  <MapPinIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px] md:max-w-xs text-[10px] md:text-xs">
                    {order.deliveryAddress}
                  </span>
                </p>
              )}
            </div>

            {/* Items Preview */}
            <div className="mt-2 md:mt-3">
              <p className="text-[10px] md:text-xs font-medium text-gray-700 mb-1">Items:</p>
              <div className="flex flex-wrap gap-1">
                {order.items?.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="text-[8px] md:text-xs bg-gray-100 px-1.5 md:px-2 py-0.5 rounded-full">
                    {item.quantity}x {item.name}
                  </span>
                ))}
                {order.items?.length > 3 && (
                  <span className="text-[8px] md:text-xs bg-gray-100 px-1.5 md:px-2 py-0.5 rounded-full">
                    +{order.items.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-2 md:gap-3 mt-2 md:mt-0">
            <div className="text-right">
              <p className="text-base md:text-lg lg:text-2xl font-bold text-primary-600">
                {formatCurrency(order.total)}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">
                {order.items?.length || 0} items
              </p>
            </div>

            <div className="flex gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm px-2 md:px-3 py-1"
                onClick={() => onViewDetails(order)}
              >
                View
              </Button>
              
              {onUpdateStatus && (userRole === 'admin' || userRole === 'delivery') && (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs md:text-sm px-2 md:px-3 py-1"
                  onClick={() => onUpdateStatus(order)}
                >
                  Update
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