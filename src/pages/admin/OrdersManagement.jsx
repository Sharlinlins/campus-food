import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { orderService } from '../../services/orderService'
import { deliveryService } from '../../services/deliveryService'
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  TruckIcon,
  ClockIcon,
  FireIcon,
  ShoppingBagIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const OrdersManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null)
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchDeliveryBoys()
    
    // Set up real-time listener for orders
    const unsubscribe = orderService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const fetchOrders = async () => {
    try {
      const ordersData = await orderService.getOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryBoys = async () => {
    try {
      const boys = await deliveryService.getAvailableDeliveryBoys()
      console.log('Available delivery boys:', boys)
      setDeliveryBoys(boys)
    } catch (error) {
      console.error('Error fetching delivery boys:', error)
      toast.error('Failed to fetch delivery boys')
    }
  }

  const handleUpdateStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, additionalData)
      toast.success(`Order status updated to ${ORDER_STATUS_LABELS[newStatus]}`)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order status')
    }
  }

  const handleAssignDelivery = async (orderId, deliveryBoy) => {
    if (!deliveryBoy || !deliveryBoy.id) {
      toast.error('Invalid delivery boy selected')
      return
    }

    setAssignLoading(true)
    try {
      console.log('Assigning delivery boy:', deliveryBoy)
      await orderService.assignDeliveryBoy(orderId, deliveryBoy.id, deliveryBoy.name)
      toast.success(`${deliveryBoy.name} assigned successfully`)
      setShowAssignModal(false)
      setSelectedOrderForAssign(null)
      // Refresh the delivery boys list
      await fetchDeliveryBoys()
    } catch (error) {
      console.error('Error assigning delivery:', error)
      toast.error(error.message || 'Failed to assign delivery partner')
    } finally {
      setAssignLoading(false)
    }
  }

  const getAvailableActions = (order) => {
    const actions = []
    
    switch(order.status) {
      case ORDER_STATUS.PENDING:
        actions.push(
          { label: 'Confirm', status: ORDER_STATUS.CONFIRMED, icon: CheckIcon, color: 'green' },
          { label: 'Cancel', status: ORDER_STATUS.CANCELLED, icon: XMarkIcon, color: 'red' }
        )
        break
      case ORDER_STATUS.CONFIRMED:
        actions.push(
          { label: 'Start Preparing', status: ORDER_STATUS.PREPARING, icon: FireIcon, color: 'purple' }
        )
        break
      case ORDER_STATUS.PREPARING:
        actions.push(
          { label: 'Mark Ready', status: ORDER_STATUS.READY, icon: CheckIcon, color: 'green' }
        )
        break
      case ORDER_STATUS.READY:
        actions.push(
          { label: 'Assign Delivery', action: 'assign', icon: TruckIcon, color: 'blue' }
        )
        break
      case ORDER_STATUS.ASSIGNED:
        actions.push(
          { label: 'Wait for Pickup', disabled: true, icon: ClockIcon, color: 'gray' }
        )
        break
      case ORDER_STATUS.PICKED_UP:
        actions.push(
          { label: 'On The Way', status: ORDER_STATUS.ON_THE_WAY, icon: TruckIcon, color: 'orange' }
        )
        break
      case ORDER_STATUS.ON_THE_WAY:
        actions.push(
          { label: 'Mark Delivered', status: ORDER_STATUS.DELIVERED, icon: CheckIcon, color: 'green' }
        )
        break
      default:
        break
    }
    
    return actions
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'pending') return order.status === ORDER_STATUS.PENDING
    if (filter === 'active') return [
      ORDER_STATUS.CONFIRMED, 
      ORDER_STATUS.PREPARING, 
      ORDER_STATUS.READY, 
      ORDER_STATUS.ASSIGNED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.ON_THE_WAY
    ].includes(order.status)
    if (filter === 'completed') return [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
    return true
  }).filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  const getStatusColor = (status) => {
    return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
  }

  // Function to open assign modal
  const openAssignModal = (order) => {
    setSelectedOrderForAssign(order)
    setShowAssignModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
            <p className="text-gray-600">View and manage all orders</p>
          </div>
          <Button variant="outline" onClick={fetchOrders}>
            Refresh Orders
          </Button>
        </div>

        {/* Filters */}
        <GlassCard className="mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const actions = getAvailableActions(order)
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
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
                          Restaurant: {order.restaurantName || 'Campus Food Court'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatDate(order.createdAt, 'medium')}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          ${order.total?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} items
                        </p>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {item.quantity}x {item.name} - ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    {order.deliveryBoyId && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Delivery Partner:</span> {order.deliveryBoyName || 'Assigned'}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </Button>

                        {actions.map((action, idx) => {
                          if (action.action === 'assign') {
                            return (
                              <Button
                                key={idx}
                                size="sm"
                                variant="primary"
                                onClick={() => openAssignModal(order)}
                              >
                                <TruckIcon className="h-4 w-4 mr-1" />
                                {action.label}
                              </Button>
                            )
                          } else if (action.status) {
                            return (
                              <Button
                                key={idx}
                                size="sm"
                                variant={
                                  action.color === 'red' ? 'danger' : 
                                  action.color === 'green' ? 'success' : 'primary'
                                }
                                onClick={() => handleUpdateStatus(order.id, action.status)}
                                disabled={action.disabled}
                              >
                                <action.icon className="h-4 w-4 mr-1" />
                                {action.label}
                              </Button>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {filteredOrders.length === 0 && (
              <GlassCard className="text-center py-12">
                <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders found</p>
                <p className="text-sm text-gray-400 mt-2">Try changing your filters</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Assign Delivery Modal */}
        {showAssignModal && selectedOrderForAssign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Assign Delivery Partner</h2>
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedOrderForAssign(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={assignLoading}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Order #{selectedOrderForAssign.orderNumber || selectedOrderForAssign.id.slice(-8)}
                </p>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {deliveryBoys.length === 0 ? (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No delivery boys available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Check back later or add more delivery personnel
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryBoys.map((boy) => (
                      <button
                        key={boy.id}
                        onClick={() => handleAssignDelivery(selectedOrderForAssign.id, boy)}
                        disabled={assignLoading}
                        className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{boy.name}</p>
                            <p className="text-sm text-gray-500">{boy.email}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              boy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {boy.status || 'active'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Current Orders: {boy.currentOrders || 0}/3</span>
                          {boy.vehicleType && <span>Vehicle: {boy.vehicleType}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedOrderForAssign(null)
                    }}
                    disabled={assignLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchDeliveryBoys}
                    disabled={assignLoading}
                  >
                    Refresh List
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-medium">{selectedOrder.orderNumber || selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {ORDER_STATUS_LABELS[selectedOrder.status]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{selectedOrder.userName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium capitalize">{selectedOrder.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(selectedOrder.createdAt, 'long')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery Address</p>
                      <p className="font-medium">{selectedOrder.deliveryAddress || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Status History */}
                  {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Status History</h3>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((history, index) => (
                          <div key={index} className="flex items-start space-x-3 text-sm">
                            <span className={`inline-block w-2 h-2 mt-1.5 rounded-full ${
                              history.status === ORDER_STATUS.DELIVERED ? 'bg-green-500' :
                              history.status === ORDER_STATUS.CANCELLED ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}></span>
                            <div className="flex-1">
                              <p className="font-medium">{ORDER_STATUS_LABELS[history.status]}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(history.timestamp, 'medium')}
                                {history.note && ` - ${history.note}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span>${selectedOrder.deliveryFee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span className="text-primary-600">${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.specialInstructions && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500">Special Instructions</p>
                      <p className="italic">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersManagement