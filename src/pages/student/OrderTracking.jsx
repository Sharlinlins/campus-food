import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { orderService } from '../../services/orderService'
import { deliveryService } from '../../services/deliveryService'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  TruckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'

const OrderTracking = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [deliveryBoy, setDeliveryBoy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deliveryLocation, setDeliveryLocation] = useState(null)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  useEffect(() => {
    if (order?.deliveryBoyId) {
      fetchDeliveryBoyDetails(order.deliveryBoyId)
      subscribeToDeliveryLocation(order.deliveryBoyId)
    }
  }, [order?.deliveryBoyId])

  const fetchOrderDetails = async () => {
    try {
      const orderData = await orderService.getOrderById(orderId)
      setOrder(orderData)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryBoyDetails = async (deliveryBoyId) => {
    try {
      const boy = await deliveryService.getDeliveryBoyDetails(deliveryBoyId)
      setDeliveryBoy(boy)
    } catch (error) {
      console.error('Error fetching delivery boy:', error)
    }
  }

  const subscribeToDeliveryLocation = (deliveryBoyId) => {
    const unsubscribe = deliveryService.subscribeToLocation(deliveryBoyId, (location) => {
      setDeliveryLocation(location)
    })
    return unsubscribe
  }

  const getStatusSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: ClockIcon },
      { status: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon },
      { status: 'preparing', label: 'Preparing', icon: ClockIcon },
      { status: 'ready', label: 'Ready for Pickup', icon: CheckCircleIcon },
      { status: 'assigned', label: 'Delivery Assigned', icon: UserIcon },
      { status: 'picked_up', label: 'Picked Up', icon: TruckIcon },
      { status: 'on_the_way', label: 'On the Way', icon: TruckIcon },
      { status: 'delivered', label: 'Delivered', icon: CheckCircleIcon }
    ]

    const currentStepIndex = steps.findIndex(step => step.status === order?.status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8">
          <GlassCard className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Order not found</p>
            <Button onClick={() => navigate('/my-orders')} variant="primary">
              Back to Orders
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  const steps = getStatusSteps()

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Order</h1>
          <p className="text-gray-600">Order #{order.id.slice(-8)}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tracking Status */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Order Status</h2>
              
              {/* Progress Steps */}
              <div className="relative">
                {steps.map((step, index) => (
                  <div key={step.status} className="relative flex items-start mb-8 last:mb-0">
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className={`absolute left-4 top-8 w-0.5 h-16 ${
                        step.completed ? 'bg-primary-500' : 'bg-gray-300'
                      }`} />
                    )}
                    
                    {/* Step Icon */}
                    <div className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                      ${step.completed 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                      }
                      ${step.current ? 'ring-4 ring-primary-100' : ''}
                    `}>
                      {step.completed ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Step Info */}
                    <div className="ml-4 flex-1">
                      <h3 className={`font-medium ${
                        step.completed ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </h3>
                      {step.current && order.updatedAt && (
                        <p className="text-sm text-gray-500">
                          {formatDate(order.updatedAt, 'time')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Items */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          {item.quantity}x
                        </span>
                        <span className="text-gray-800">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Delivery Info */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <GlassCard className="p-6 mb-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>${order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>${order.deliveryFee?.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">${order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="flex items-center gap-2 mb-1">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Payment: {order.paymentMethod}
                </p>
                <p className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Ordered: {formatDate(order.createdAt, 'relative')}
                </p>
              </div>
            </GlassCard>

            {/* Delivery Info */}
            {deliveryBoy && (
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Delivery Partner</h2>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">{deliveryBoy.name}</p>
                    <p className="text-sm text-gray-500">{deliveryBoy.phone}</p>
                  </div>
                </div>

                {deliveryLocation && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Current Location</p>
                    <p className="text-xs text-gray-600">
                      Lat: {deliveryLocation.lat}, Lng: {deliveryLocation.lng}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => window.open(`tel:${deliveryBoy.phone}`)}
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Call Delivery Partner
                  </Button>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      // Open in maps
                      if (deliveryLocation) {
                        window.open(`https://www.google.com/maps?q=${deliveryLocation.lat},${deliveryLocation.lng}`)
                      }
                    }}
                  >
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Track on Map
                  </Button>
                </div>
              </GlassCard>
            )}

            {/* Delivery Address */}
            <GlassCard className="p-6 mt-4">
              <h2 className="text-lg font-semibold mb-2">Delivery Address</h2>
              <p className="text-gray-600 text-sm">{order.deliveryAddress}</p>
              {order.specialInstructions && (
                <>
                  <p className="font-medium text-sm mt-3 mb-1">Special Instructions:</p>
                  <p className="text-gray-600 text-sm">{order.specialInstructions}</p>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTracking