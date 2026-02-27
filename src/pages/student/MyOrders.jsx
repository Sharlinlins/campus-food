import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import OrderCard from '../../components/food/OrderCard'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { orderService } from '../../services/orderService'
import { motion, AnimatePresence } from 'framer-motion'
import { ClockIcon, CheckCircleIcon, XCircleIcon, TruckIcon } from '@heroicons/react/24/outline'

const MyOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const userOrders = await orderService.getOrders(user.uid, 'student')
      setOrders(userOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const getFilterIcon = (filterType) => {
    switch(filterType) {
      case 'pending': return <ClockIcon className="h-5 w-5" />
      case 'delivered': return <CheckCircleIcon className="h-5 w-5" />
      case 'cancelled': return <XCircleIcon className="h-5 w-5" />
      case 'on_the_way': return <TruckIcon className="h-5 w-5" />
      default: return null
    }
  }

  const filters = [
    { value: 'all', label: 'All Orders', icon: null },
    { value: 'pending', label: 'Pending', icon: getFilterIcon('pending') },
    { value: 'confirmed', label: 'Confirmed', icon: getFilterIcon('pending') },
    { value: 'preparing', label: 'Preparing', icon: getFilterIcon('pending') },
    { value: 'on_the_way', label: 'On The Way', icon: getFilterIcon('on_the_way') },
    { value: 'delivered', label: 'Delivered', icon: getFilterIcon('delivered') },
    { value: 'cancelled', label: 'Cancelled', icon: getFilterIcon('cancelled') }
  ]

  const handleViewDetails = (order) => {
    navigate(`/order-tracking/${order.id}`)
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

        {/* Filters */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`
                  px-4 py-2 rounded-full flex items-center gap-2 transition-all
                  ${filter === f.value
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No orders found</p>
                  <Button onClick={() => navigate('/menu')} variant="primary">
                    Browse Menu
                  </Button>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={handleViewDetails}
                    userRole="student"
                  />
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