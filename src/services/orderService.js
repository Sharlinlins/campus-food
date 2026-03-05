import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from './firebase'
import { generateBill } from '../utils/generateBill'
import { assignDelivery } from '../utils/assignDelivery'
import { ORDER_STATUS } from '../utils/constants'
import { notificationService } from './notificationService'

// Constants for delivery cycle
const DELIVERIES_PER_CYCLE = 5 // Reset after 5 deliveries

// Helper function for creating notifications (defined inside the object)
const createOrderNotification = async (orderId, newStatus, userId, userRole, orderData = {}) => {
  try {
    console.log('Creating notification for:', { orderId, newStatus, userId, userRole })

    const notifications = {
      [ORDER_STATUS.CONFIRMED]: {
        title: 'Order Confirmed',
        body: 'Your order has been confirmed by the restaurant',
        type: 'order_update'
      },
      [ORDER_STATUS.PREPARING]: {
        title: 'Order Being Prepared',
        body: 'Your order is now being prepared',
        type: 'order_update'
      },
      [ORDER_STATUS.READY]: {
        title: 'Order Ready',
        body: 'Your order is ready for pickup',
        type: 'order_update'
      },
      [ORDER_STATUS.ASSIGNED]: {
        title: 'Delivery Partner Assigned',
        body: orderData.deliveryBoyName
          ? `${orderData.deliveryBoyName} has been assigned to your order`
          : 'A delivery partner has been assigned to your order',
        type: 'order_update'
      },
      [ORDER_STATUS.PICKED_UP]: {
        title: 'Order Picked Up',
        body: 'Your order has been picked up by the delivery partner',
        type: 'order_update'
      },
      [ORDER_STATUS.ON_THE_WAY]: {
        title: 'Order On The Way',
        body: 'Your order is on the way to you',
        type: 'order_update'
      },
      [ORDER_STATUS.DELIVERED]: {
        title: 'Order Delivered',
        body: 'Your order has been delivered successfully',
        type: 'order_update'
      },
      [ORDER_STATUS.CANCELLED]: {
        title: 'Order Cancelled',
        body: orderData.reason || 'Your order has been cancelled',
        type: 'order_update'
      }
    }

    const notification = notifications[newStatus]
    if (notification && userId) {
      await notificationService.createNotification(userId, {
        ...notification,
        data: {
          orderId,
          url: `/order-tracking/${orderId}`,
          status: newStatus
        }
      })
      console.log('✅ Notification created successfully')
    }
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

export const orderService = {
  async createOrder(orderData) {
    try {
      console.log('Creating order with data:', orderData)

      // Validate required fields
      if (!orderData.userId) throw new Error('User ID is required')
      if (!orderData.items || orderData.items.length === 0) throw new Error('Order must have items')
      if (!orderData.deliveryAddress) throw new Error('Delivery address is required')

      // Create initial status history with client timestamps as ISO strings
      const initialHistory = [
        {
          status: ORDER_STATUS.PENDING,
          timestamp: new Date().toISOString(), // Store as ISO string, not serverTimestamp
          note: 'Order placed'
        }
      ]

      const order = {
        ...orderData,
        status: ORDER_STATUS.PENDING,
        createdAt: serverTimestamp(), // This is fine for top-level
        createdAtISO: new Date().toISOString(), // Add ISO string as backup
        updatedAt: serverTimestamp(),
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        statusHistory: initialHistory
      }

      console.log('Saving order to Firestore...')
      const docRef = await addDoc(collection(db, 'orders'), order)
      console.log('Order created with ID:', docRef.id)

      // Generate bill
      const bill = generateBill({ id: docRef.id, ...order })
      await updateDoc(docRef, { bill })

      // Notify admin about new order
      await this.notifyAdminNewOrder(docRef.id, order)

      return { id: docRef.id, ...order, bill }
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error(error.message || 'Failed to create order')
    }
  },

  // Add this new function to notify admins
  async notifyAdminNewOrder(orderId, orderData) {
    try {
      // Get all admin users
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      )
      const adminsSnapshot = await getDocs(adminsQuery)

      const notificationPromises = adminsSnapshot.docs.map(adminDoc => {
        const adminId = adminDoc.id
        return notificationService.createNotification(adminId, {
          title: '🆕 New Order Received',
          body: `Order #${orderData.orderNumber || orderId.slice(-8)} for ₹${orderData.total?.toFixed(2) || '0.00'}`,
          type: 'new_order',
          data: {
            orderId,
            url: `/admin/orders?order=${orderId}`,
            customerName: orderData.userName,
            total: orderData.total
          }
        })
      })

      await Promise.all(notificationPromises)
      console.log(`✅ Notified ${adminsSnapshot.size} admins about new order`)
    } catch (error) {
      console.error('Error notifying admins:', error)
    }
  },

  async getOrders(userId = null, role = null) {
    try {
      let q = collection(db, 'orders')

      if (userId && role === 'student') {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      } else if (userId && role === 'delivery') {
        q = query(
          collection(db, 'orders'),
          where('deliveryBoyId', '==', userId),
          where('status', 'in', [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY]),
          orderBy('createdAt', 'desc')
        )
      } else if (role === 'admin') {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      } else {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  },

  async getOrderById(orderId) {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      if (orderDoc.exists()) {
        return { id: orderDoc.id, ...orderDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching order:', error)
      throw new Error('Failed to fetch order')
    }
  },

  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      console.log('🔄 ===== UPDATE ORDER STATUS START =====')
      console.log('Order ID:', orderId)
      console.log('New Status:', newStatus)
      console.log('Additional Data:', additionalData)

      // Validate inputs
      if (!orderId) throw new Error('Order ID is required')
      if (!newStatus) throw new Error('New status is required')

      // Get order reference
      const orderRef = doc(db, 'orders', orderId)

      // Check if order exists
      const orderDoc = await getDoc(orderRef)

      if (!orderDoc.exists()) {
        throw new Error('Order not found')
      }

      const orderData = orderDoc.data()
      const currentHistory = orderData.statusHistory || []

      // Create a new history entry with client-side timestamp
      const newHistoryEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: this.getStatusNote(newStatus, additionalData),
        ...additionalData
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory: [...currentHistory, newHistoryEntry]
      }

      // Add timestamp fields for specific statuses
      if (newStatus === ORDER_STATUS.ASSIGNED) {
        updateData.assignedAt = serverTimestamp()
      } else if (newStatus === ORDER_STATUS.PICKED_UP) {
        updateData.pickedUpAt = serverTimestamp()
      } else if (newStatus === ORDER_STATUS.ON_THE_WAY) {
        updateData.dispatchedAt = serverTimestamp()
      } else if (newStatus === ORDER_STATUS.DELIVERED) {
        updateData.deliveredAt = serverTimestamp()

        // 🔄 CRITICAL FIX: When order is delivered, decrement the delivery boy's currentOrders
        if (orderData.deliveryBoyId) {
          await this.decrementDeliveryBoyOrders(orderData.deliveryBoyId)
          // Also update cycle stats
          await this.updateDeliveryBoyAfterDelivery(orderData.deliveryBoyId)
        }
      } else if (newStatus === ORDER_STATUS.CANCELLED) {
        updateData.cancelledAt = serverTimestamp()

        // 🔄 If order is cancelled, also decrement the count
        if (orderData.deliveryBoyId) {
          await this.decrementDeliveryBoyOrders(orderData.deliveryBoyId)
        }
      }

      // Add any additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        if (key !== 'note' && !updateData[key]) {
          updateData[key] = value
        }
      })

      console.log('Update data prepared:', updateData)

      // Perform the update
      await updateDoc(orderRef, updateData)
      console.log('✅ Firestore update successful')

      // Create notification for the user
      if (orderData.userId) {
        await createOrderNotification(
          orderId,
          newStatus,
          orderData.userId,
          orderData.userRole || 'student',
          { ...additionalData, ...updateData }
        )
      }

      console.log(`✅ Order ${orderId} updated to ${newStatus} successfully`)
      console.log('🔄 ===== UPDATE ORDER STATUS END =====')

      return true
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      throw new Error(`Failed to update order status: ${error.message}`)
    }
  },

  // New function to decrement delivery boy's orders
  async decrementDeliveryBoyOrders(deliveryBoyId) {
    try {
      console.log(`📉 Decrementing orders for delivery boy: ${deliveryBoyId}`)

      const deliveryBoyRef = doc(db, 'users', deliveryBoyId)
      const deliveryBoyDoc = await getDoc(deliveryBoyRef)

      if (!deliveryBoyDoc.exists()) {
        console.error('Delivery boy not found')
        return
      }

      const boyData = deliveryBoyDoc.data()
      const currentOrders = boyData.currentOrders || 0

      // Only decrement if greater than 0
      if (currentOrders > 0) {
        const newOrderCount = currentOrders - 1

        await updateDoc(deliveryBoyRef, {
          currentOrders: newOrderCount,
          status: newOrderCount >= 3 ? 'busy' : 'active',
          updatedAt: serverTimestamp()
        })

        console.log(`✅ Decremented orders from ${currentOrders} to ${newOrderCount}`)
        console.log(`   Status updated to: ${newOrderCount >= 3 ? 'busy' : 'active'}`)
      } else {
        console.log('⚠️ Current orders already 0, no decrement needed')
      }

    } catch (error) {
      console.error('Error decrementing delivery boy orders:', error)
    }
  },

  async updateDeliveryBoyAfterDelivery(deliveryBoyId) {
    try {
      console.log(`📊 Updating delivery boy cycle stats after delivery: ${deliveryBoyId}`)

      const deliveryBoyRef = doc(db, 'users', deliveryBoyId)
      const deliveryBoyDoc = await getDoc(deliveryBoyRef)

      if (!deliveryBoyDoc.exists()) {
        console.error('Delivery boy not found')
        return
      }

      const boyData = deliveryBoyDoc.data()
      const currentCycleDeliveries = boyData.cycleDeliveries || 0
      const newCycleCount = currentCycleDeliveries + 1

      console.log(`Delivery cycle progress: ${newCycleCount}/${DELIVERIES_PER_CYCLE}`)

      // Prepare update data for cycle stats only (not currentOrders)
      const updateData = {
        totalDeliveries: (boyData.totalDeliveries || 0) + 1,
        cycleDeliveries: newCycleCount,
        updatedAt: serverTimestamp()
      }

      // Check if cycle is complete
      if (newCycleCount >= DELIVERIES_PER_CYCLE) {
        console.log('🎯 Delivery cycle complete! Resetting for next cycle...')

        updateData.cycleDeliveries = 0
        updateData.cyclesCompleted = (boyData.cyclesCompleted || 0) + 1
        updateData.lastCycleCompletedAt = serverTimestamp()
        updateData.totalEarnings = (boyData.totalEarnings || 0) + 50 // ₹50 bonus

        await this.notifyDeliveryBoyCycleComplete(deliveryBoyId, boyData.name || 'Delivery Partner')
      }

      await updateDoc(deliveryBoyRef, updateData)
      console.log('✅ Delivery boy cycle stats updated successfully')

    } catch (error) {
      console.error('Error updating delivery boy after delivery:', error)
    }
  },

  // Notify delivery boy when cycle completes
  async notifyDeliveryBoyCycleComplete(deliveryBoyId, boyName) {
    try {
      await notificationService.createNotification(deliveryBoyId, {
        title: '🎉 Delivery Cycle Complete!',
        body: `Congratulations! You've completed ${DELIVERIES_PER_CYCLE} deliveries. You've earned a ₹50 bonus! Ready for the next cycle!`,
        type: 'cycle_complete',
        data: {
          bonus: 50,
          cycleCount: DELIVERIES_PER_CYCLE,
          url: '/delivery'
        }
      })
      console.log('✅ Cycle completion notification sent')
    } catch (error) {
      console.error('Error sending cycle completion notification:', error)
    }
  },

  getStatusNote(status, additionalData = {}) {
    const notes = {
      [ORDER_STATUS.PENDING]: 'Order placed',
      [ORDER_STATUS.CONFIRMED]: 'Order confirmed by restaurant',
      [ORDER_STATUS.PREPARING]: 'Kitchen started preparing',
      [ORDER_STATUS.READY]: 'Order ready for pickup',
      [ORDER_STATUS.ASSIGNED]: additionalData.note || 'Delivery partner assigned',
      [ORDER_STATUS.PICKED_UP]: 'Order picked up by delivery partner',
      [ORDER_STATUS.ON_THE_WAY]: 'On the way to delivery',
      [ORDER_STATUS.DELIVERED]: 'Order delivered successfully',
      [ORDER_STATUS.CANCELLED]: additionalData.reason || 'Order cancelled'
    }
    return notes[status] || `Status updated to ${status}`
  },

  async assignDeliveryBoy(orderId, deliveryBoyId, deliveryBoyName) {
    try {
      console.log('🔍 Assigning delivery boy:', { orderId, deliveryBoyId, deliveryBoyName })

      // Validate inputs
      if (!orderId) throw new Error('Order ID is required')
      if (!deliveryBoyId) throw new Error('Delivery Boy ID is required')
      if (!deliveryBoyName) throw new Error('Delivery Boy Name is required')

      // First, update the order status
      console.log('Step 1: Updating order status...')
      await this.updateOrderStatus(orderId, ORDER_STATUS.ASSIGNED, {
        deliveryBoyId,
        deliveryBoyName,
        note: `Assigned to ${deliveryBoyName}`
      })
      console.log('✅ Order status updated')

      // Then, update the delivery boy's count
      console.log('Step 2: Updating delivery boy stats...')
      const deliveryBoyRef = doc(db, 'users', deliveryBoyId)
      const deliveryBoyDoc = await getDoc(deliveryBoyRef)

      if (!deliveryBoyDoc.exists()) {
        throw new Error('Delivery boy not found')
      }

      const boyData = deliveryBoyDoc.data()
      const currentOrders = boyData.currentOrders || 0

      await updateDoc(deliveryBoyRef, {
        currentOrders: currentOrders + 1,
        status: currentOrders + 1 >= 3 ? 'busy' : 'active',
        updatedAt: serverTimestamp()
      })
      console.log('✅ Delivery boy stats updated')

      // 🔔 NOTIFICATION: Notify delivery boy about new assignment
      await this.notifyDeliveryBoy(orderId, deliveryBoyId, deliveryBoyName)

      console.log('✅ Assignment complete')
      return true
    } catch (error) {
      console.error('❌ Assignment failed:', error)
      throw new Error(`Failed to assign delivery boy: ${error.message}`)
    }
  },

  // Add this new function to notify delivery boy
  async notifyDeliveryBoy(orderId, deliveryBoyId, deliveryBoyName) {
    try {
      // Get order details
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      if (!orderDoc.exists()) return

      const order = orderDoc.data()

      await notificationService.createNotification(deliveryBoyId, {
        title: '🚚 New Delivery Assignment',
        body: `Order #${order.orderNumber || orderId.slice(-8)} assigned to you`,
        type: 'delivery_assignment',
        data: {
          orderId,
          url: '/delivery/orders',
          customerName: order.userName,
          deliveryAddress: order.deliveryAddress,
          total: order.total
        }
      })

      console.log(`✅ Notified delivery boy ${deliveryBoyName} about new assignment`)
    } catch (error) {
      console.error('Error notifying delivery boy:', error)
    }
  },

  // Add this function to sync delivery boy order counts
  async syncDeliveryBoyOrderCount(deliveryBoyId) {
    try {
      console.log(`🔄 Syncing order count for delivery boy: ${deliveryBoyId}`)

      // Count active orders for this delivery boy
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('deliveryBoyId', '==', deliveryBoyId),
        where('status', 'in', ['assigned', 'picked_up', 'on_the_way'])
      )

      const snapshot = await getDocs(activeOrdersQuery)
      const activeCount = snapshot.size

      console.log(`Found ${activeCount} active orders`)

      // Update the delivery boy's count
      const deliveryBoyRef = doc(db, 'users', deliveryBoyId)
      await updateDoc(deliveryBoyRef, {
        currentOrders: activeCount,
        status: activeCount >= 3 ? 'busy' : 'active',
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Synced count to ${activeCount}`)
      return activeCount

    } catch (error) {
      console.error('Error syncing order count:', error)
      throw error
    }
  },

async cancelOrder(orderId, reason) {
  try {
    const orderRef = doc(db, 'orders', orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error('Order not found')
    }

    const orderData = orderDoc.data()

    // If order was assigned, decrement delivery boy's count
    if (orderData.deliveryBoyId && 
        [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY].includes(orderData.status)) {
      await this.decrementDeliveryBoyOrders(orderData.deliveryBoyId)
    }

    return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, { reason })
  } catch (error) {
    console.error('Error cancelling order:', error)
    throw new Error('Failed to cancel order')
  }
},

  subscribeToOrders(callback, filters = {}) {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))

    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId))
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        q = query(q, where('status', 'in', filters.status))
      } else {
        q = query(q, where('status', '==', filters.status))
      }
    }

    if (filters.deliveryBoyId) {
      q = query(q, where('deliveryBoyId', '==', filters.deliveryBoyId))
    }

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(orders)
    }, (error) => {
      console.error('Error in orders subscription:', error)
    })
  }
}