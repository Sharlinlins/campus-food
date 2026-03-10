import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { orderService } from '../../services/orderService'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatCurrency } from '../../utils/formatDate'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  TruckIcon, 
  ArrowPathIcon,
  PhoneIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const AssignedOrders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('current')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      console.log('👤 User ID:', user.uid)
      fetchAllData()
      
      // Set up real-time listener for all orders
      const unsubscribe = orderService.subscribeToOrders((updatedOrders) => {
        console.log('📦 Real-time orders update received:', updatedOrders.length)
        
        const myOrders = updatedOrders.filter(order => order.deliveryBoyId === user.uid)
        
        // Separate current and history
        const current = myOrders.filter(o => 
          [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY].includes(o.status)
        )
        const past = myOrders.filter(o => 
          [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status)
        )
        
        console.log('📊 Current orders:', current.length)
        console.log('📊 History orders:', past.length)
        
        setOrders(current)
        setHistory(past)
      }, { deliveryBoyId: user.uid })
      
      return () => unsubscribe()
    }
  }, [user])

  const fetchAllData = async () => {
    setRefreshing(true)
    try {
      console.log('🔍 Fetching all data for delivery boy:', user.uid)
      
      // Get all orders for this delivery boy
      const allOrders = await orderService.getOrders(user.uid, 'delivery')
      console.log('📦 Total orders fetched:', allOrders.length)
      
      // Log phone numbers for debugging
      allOrders.forEach(order => {
        console.log(`Order ${order.id.slice(-8)}: phone=${order.userPhone || 'MISSING'}`)
      })
      
      // Separate current and history
      const current = allOrders.filter(o => 
        [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY].includes(o.status)
      )
      const past = allOrders.filter(o => 
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status)
      )
      
      console.log('✅ Current orders:', current.length)
      console.log('✅ History orders:', past.length)
      
      setOrders(current)
      setHistory(past)
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated`)
      fetchAllData()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-800',
      [ORDER_STATUS.PICKED_UP]: 'bg-purple-100 text-purple-800',
      [ORDER_STATUS.ON_THE_WAY]: 'bg-orange-100 text-orange-800',
      [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
      [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case ORDER_STATUS.DELIVERED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case ORDER_STATUS.CANCELLED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />
    }
  }

  // Format phone number for display
  const formatPhoneDisplay = (phone) => {
    if (!phone) return 'Not provided'
    
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Format Indian numbers
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return phone // Return as is if can't format
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-16 text-center">
          <p>Please log in to view assigned orders</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Deliveries</h1>
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'current'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Current Deliveries ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Delivery History ({history.length})
          </button>
        </div>

        {/* Current Orders */}
        {activeTab === 'current' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {orders.length === 0 ? (
                  <GlassCard className="text-center py-12">
                    <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No current deliveries</p>
                    <p className="text-sm text-gray-400 mt-2">New assignments will appear here</p>
                  </GlassCard>
                ) : (
                  orders.map((order, index) => {
                    // Debug each order
                    console.log(`Rendering order ${order.id.slice(-8)}:`, {
                      phone: order.userPhone,
                      hasPhone: !!order.userPhone
                    })
                    
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl shadow-lg p-6"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-lg">
                                Order #{order.orderNumber || order.id.slice(-8)}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                            </div>
                            
                            <div className="space-y-4">
                              {/* Customer Name */}
                              <div className="flex items-start gap-3">
                                <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">Customer</p>
                                  <p className="text-base font-medium">{order.userName || 'N/A'}</p>
                                </div>
                              </div>
                              
                              {/* PHONE NUMBER - Now with proper display */}
                              <div className="flex items-start gap-3">
                                <PhoneIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                  order.userPhone ? 'text-green-500' : 'text-red-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Phone Number</p>
                                  {order.userPhone ? (
                                    <div>
                                      <p className="text-base font-semibold text-green-700">
                                        {formatPhoneDisplay(order.userPhone)}
                                      </p>
                                      <div className="flex gap-2 mt-2">
                                        <a 
                                          href={`tel:${order.userPhone}`}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                                        >
                                          <PhoneIcon className="h-4 w-4" />
                                          Call Now
                                        </a>
                                        <a 
                                          href={`https://wa.me/${order.userPhone.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                                        >
                                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2c-5.349 0-9.703 4.353-9.706 9.702 0 1.71.447 3.381 1.291 4.845L2 22l5.539-1.577c1.414.77 3.006 1.178 4.654 1.179h.004c5.347 0 9.702-4.353 9.704-9.702.001-2.593-1.01-5.037-2.82-6.872zM12.006 20.275h-.003c-1.448 0-2.868-.39-4.105-1.122l-.295-.176-3.288.878.879-3.208-.192-.308a8.016 8.016 0 0 1-1.235-4.256c.002-4.424 3.602-8.024 8.03-8.024 2.147 0 4.164.838 5.682 2.359a7.959 7.959 0 0 1 2.355 5.674c-.002 4.425-3.602 8.026-8.028 8.027z"/>
                                          </svg>
                                          WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-base font-medium text-red-600">
                                        No phone number provided
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Contact admin for customer contact
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Delivery Address */}
                              <div className="flex items-start gap-3">
                                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">Delivery Address</p>
                                  <p className="text-base">{order.deliveryAddress || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Order Items Preview */}
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs font-medium text-gray-500 mb-2">Items to deliver:</p>
                              <div className="flex flex-wrap gap-1">
                                {order.items?.map((item, i) => (
                                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                    {item.quantity}x {item.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 min-w-[150px]">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-600">
                                {formatCurrency(order.total)}
                              </p>
                              <p className="text-xs text-gray-500 mb-3">
                                {order.items?.length || 0} items
                              </p>
                            </div>

                            <div className="space-y-2 w-full">
                              {order.status === ORDER_STATUS.ASSIGNED && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  fullWidth
                                  onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.PICKED_UP)}
                                >
                                  Mark Picked Up
                                </Button>
                              )}
                              
                              {order.status === ORDER_STATUS.PICKED_UP && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  fullWidth
                                  onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.ON_THE_WAY)}
                                >
                                  Start Delivery
                                </Button>
                              )}
                              
                              {order.status === ORDER_STATUS.ON_THE_WAY && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  fullWidth
                                  onClick={() => handleUpdateStatus(order.id, ORDER_STATUS.DELIVERED)}
                                >
                                  Mark Delivered
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </>
            )}
          </div>
        )}

        {/* Delivery History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {history.length === 0 ? (
                  <GlassCard className="text-center py-12">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No delivery history yet</p>
                    <p className="text-sm text-gray-400 mt-2">Complete some deliveries to see them here</p>
                  </GlassCard>
                ) : (
                  history.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(order.status)}
                        <div className="flex-1">
                          <div className="flex flex-wrap justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{order.orderNumber || order.id.slice(-8)}</p>
                              <p className="text-sm text-gray-500">{order.userName || 'Customer'}</p>
                              <p className="text-xs text-gray-400">
                                {order.deliveredAt 
                                  ? `Delivered: ${formatDate(order.deliveredAt, 'medium')}`
                                  : formatDate(order.createdAt, 'medium')
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                              <p className="font-semibold mt-1">{formatCurrency(order.total)}</p>
                            </div>
                          </div>
                          
                          {/* Phone number in history (smaller) */}
                          {order.userPhone && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                              <PhoneIcon className="h-3 w-3" />
                              <span>{formatPhoneDisplay(order.userPhone)}</span>
                            </div>
                          )}
                          
                          {/* Order items preview */}
                          <div className="mt-2 text-sm text-gray-600">
                            {order.items?.slice(0, 2).map((item, i) => (
                              <span key={i} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {order.items?.length > 2 && (
                              <span className="text-xs text-gray-400">+{order.items.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignedOrders