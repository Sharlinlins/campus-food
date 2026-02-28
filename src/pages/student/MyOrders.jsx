import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import OrderCard from '../../components/food/OrderCard'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { orderService } from '../../services/orderService'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  TruckIcon,
  FireIcon,
  CubeIcon,
  ShoppingBagIcon 
} from '@heroicons/react/24/outline'

const MyOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()
  const navigate = useNavigate()

  // Memoized fetch function
  const fetchOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      console.log('Fetching orders for user:', user.uid)
      const userOrders = await orderService.getOrders(user.uid, 'student')
      console.log('Orders fetched:', userOrders.length)
      setOrders(userOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchOrders()
    
    // Set up real-time listener for order updates
    let unsubscribe
    if (user) {
      unsubscribe = orderService.subscribeToOrders((updatedOrders) => {
        const myOrders = updatedOrders.filter(o => o.userId === user.uid)
        setOrders(myOrders)
      }, { userId: user.uid })
    }
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, fetchOrders])

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'active') {
      return ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
    }
    if (filter === 'completed') {
      return [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
    }
    return order.status === filter
  })

  // Get appropriate icon for each status
  const getStatusIcon = (status) => {
    switch(status) {
      case ORDER_STATUS.PENDING:
      case ORDER_STATUS.CONFIRMED:
      case ORDER_STATUS.PREPARING:
        return <ClockIcon className="h-5 w-5" />
      case ORDER_STATUS.READY:
        return <CheckCircleIcon className="h-5 w-5" />
      case ORDER_STATUS.ASSIGNED:
      case ORDER_STATUS.PICKED_UP:
        return <CubeIcon className="h-5 w-5" />
      case ORDER_STATUS.ON_THE_WAY:
        return <TruckIcon className="h-5 w-5" />
      case ORDER_STATUS.DELIVERED:
        return <CheckCircleIcon className="h-5 w-5" />
      case ORDER_STATUS.CANCELLED:
        return <XCircleIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  // Define filters with their properties
  const filters = [
    { value: 'all', label: 'All Orders', icon: ShoppingBagIcon },
    { value: 'active', label: 'Active', icon: FireIcon },
    { value: 'pending', label: 'Pending', icon: ClockIcon },
    { value: 'on_the_way', label: 'On The Way', icon: TruckIcon },
    { value: 'completed', label: 'Completed', icon: CheckCircleIcon },
    { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon }
  ]

  const handleViewDetails = (order) => {
    navigate(`/order-tracking/${order.id}`)
  }

  // Get count for each filter
  const getFilterCount = (filterValue) => {
    if (filterValue === 'all') return orders.length
    if (filterValue === 'active') {
      return orders.filter(o => ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status)).length
    }
    if (filterValue === 'completed') {
      return orders.filter(o => [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(o.status)).length
    }
    return orders.filter(o => o.status === filterValue).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your food orders</p>
        </motion.div>

        {/* Filters with counts */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {filters.map((f) => {
              const count = getFilterCount(f.value)
              const Icon = f.icon
              
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`
                    px-4 py-2 rounded-full flex items-center gap-2 transition-all whitespace-nowrap
                    ${filter === f.value
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{f.label}</span>
                  {count > 0 && (
                    <span className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs
                      ${filter === f.value
                        ? 'bg-white text-primary-600'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No orders found</p>
                  <p className="text-gray-400 text-sm mb-6">
                    {filter === 'all' 
                      ? "You haven't placed any orders yet" 
                      : `No ${filter} orders at the moment`}
                  </p>
                  <Button onClick={() => navigate('/menu')} variant="primary">
                    Browse Menu
                  </Button>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <OrderCard
                      order={order}
                      onViewDetails={handleViewDetails}
                      userRole="student"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default MyOrders