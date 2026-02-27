import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { deliveryService } from '../../services/deliveryService'
import { orderService } from '../../services/orderService'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatCurrency } from '../../utils/formatDate'
import { 
  TruckIcon, 
  CurrencyDollarIcon, 
  StarIcon,
  CubeIcon,
  CheckIcon,
  MapIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const DeliveryDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    totalEarnings: 0,
    rating: 4.5,
    activeOrders: 0,
    averageDeliveryTime: 0,
    totalDeliveries: 0
  })
  const [currentOrders, setCurrentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    if (!user) return

    console.log('Delivery user:', user.uid)
    fetchDashboardData()
    getCurrentLocation()
    
    // Subscribe to assigned orders
    const unsubscribe = orderService.subscribeToOrders((orders) => {
      const myOrders = orders.filter(order => 
        order.deliveryBoyId === user.uid && 
        [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY].includes(order.status)
      )
      
      setCurrentOrders(myOrders)
      setStats(prev => ({ ...prev, activeOrders: myOrders.length }))
    }, { 
      deliveryBoyId: user.uid,
      status: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY]
    })
    
    return () => unsubscribe()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return
    
    setRefreshing(true)
    try {
      console.log('Fetching dashboard data for user:', user.uid)
      const stats = await deliveryService.getDeliveryBoyStats(user.uid)
      console.log('Received stats:', stats)
      setStats(prev => ({ ...prev, ...stats }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          deliveryService.updateDeliveryLocation(user.uid, { latitude, longitude })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to ${newStatus}`)
      
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated to ${ORDER_STATUS_LABELS[newStatus]}`)
      
      // Refresh stats after status update
      fetchDashboardData()
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
      [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-16 text-center">
          <p>Please log in to access delivery dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Delivery Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.displayName || 'Delivery Partner'}!</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">Online</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center">
            <TruckIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{stats.todayDeliveries}</p>
            <p className="text-sm text-gray-600">Today's Deliveries</p>
            <p className="text-xs text-gray-400 mt-1">Total: {stats.totalDeliveries}</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalEarnings)}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{stats.rating.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Rating</p>
            <p className="text-xs text-gray-400 mt-1">Avg: {stats.averageDeliveryTime} min</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-600 font-bold text-lg">{stats.activeOrders}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activeOrders}</p>
            <p className="text-sm text-gray-600">Active Orders</p>
          </GlassCard>
        </div>

        {/* Current Orders */}
        <h2 className="text-xl font-semibold mb-4">Current Assigned Orders</h2>
        
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
          <div className="space-y-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.orderNumber || order.id.slice(-8)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {order.userName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Delivery Address: {order.deliveryAddress || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Order placed: {formatDate(order.createdAt, 'relative')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Items to deliver:</p>
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <p key={i} className="text-sm text-gray-600">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                    {order.status === ORDER_STATUS.ASSIGNED && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateOrderStatus(order.id, ORDER_STATUS.PICKED_UP)}
                      >
                        <CubeIcon className="h-4 w-4 mr-1" />
                        Mark as Picked Up
                      </Button>
                    )}
                    
                    {order.status === ORDER_STATUS.PICKED_UP && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateOrderStatus(order.id, ORDER_STATUS.ON_THE_WAY)}
                      >
                        <TruckIcon className="h-4 w-4 mr-1" />
                        Start Delivery
                      </Button>
                    )}
                    
                    {order.status === ORDER_STATUS.ON_THE_WAY && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateOrderStatus(order.id, ORDER_STATUS.DELIVERED)}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Mark as Delivered
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
                    >
                      <MapIcon className="h-4 w-4 mr-1" />
                      Get Directions
                    </Button>
                  </div>

                  {/* Delivery Timer */}
                  {order.assignedAt && order.status !== ORDER_STATUS.DELIVERED && (
                    <div className="mt-3 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 inline mr-1" />
                      Assigned: {formatDate(order.assignedAt, 'relative')}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <GlassCard className="text-center py-12">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No assigned orders at the moment</p>
                <p className="text-sm text-gray-400 mt-2">You'll be notified when new orders arrive</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Location Status */}
        <div className="mt-8">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${location ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {location ? 'Location sharing active' : 'Fetching location...'}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={getCurrentLocation}>
                Update Location
              </Button>
            </div>
            {location && (
              <p className="text-xs text-gray-400 mt-2">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default DeliveryDashboard