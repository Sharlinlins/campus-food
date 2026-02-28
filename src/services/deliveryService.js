import { 
  collection, 
  getDocs, 
  getDoc, 
  updateDoc,
  doc, 
  query, 
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

export const deliveryService = {
  async getAvailableDeliveryBoys() {
    try {
      console.log('🔍 Fetching available delivery boys...')
      
      // Get ALL delivery boys (not just active ones) for debugging
      const allQuery = query(
        collection(db, 'users'),
        where('role', '==', 'delivery')
      )
      const allSnapshot = await getDocs(allQuery)
      console.log(`📊 Total delivery boys in DB: ${allSnapshot.size}`)
      
      allSnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`  - ${data.name}:`, {
          id: doc.id,
          status: data.status,
          isActive: data.isActive,
          currentOrders: data.currentOrders || 0
        })
      })

      // Now get available ones (active AND with less than 3 orders)
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'delivery')
        // We'll filter in code because 'isActive' might be missing
      )
      
      const querySnapshot = await getDocs(q)
      console.log(`✅ Found ${querySnapshot.size} delivery boys`)
      
      const availableBoys = []
      
      querySnapshot.forEach(doc => {
        const boy = {
          id: doc.id,
          ...doc.data(),
          currentOrders: doc.data().currentOrders || 0,
          isActive: doc.data().isActive !== false, // Default to true if missing
          status: doc.data().status || 'active' // Default to active if missing
        }
        
        // Consider a boy available if:
        // 1. isActive is true (or missing)
        // 2. status is 'active' or not set
        // 3. currentOrders < 3
        const isAvailable = boy.isActive && 
                           (boy.status === 'active' || !boy.status) && 
                           boy.currentOrders < 3
        
        if (isAvailable) {
          availableBoys.push(boy)
          console.log(`  ✅ Available: ${boy.name} (orders: ${boy.currentOrders}/3)`)
        } else {
          console.log(`  ❌ Not available: ${boy.name} -`, {
            isActive: boy.isActive,
            status: boy.status,
            orders: boy.currentOrders
          })
        }
      })
      
      console.log(`🎯 Final available delivery boys: ${availableBoys.length}`)
      return availableBoys
      
    } catch (error) {
      console.error('❌ Error fetching delivery boys:', error)
      return []
    }
  },

  async getDeliveryBoyStats(deliveryBoyId) {
    try {
      console.log(`📊 Fetching stats for delivery boy: ${deliveryBoyId}`)
      
      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Get all orders for this delivery boy
      const ordersQuery = query(
        collection(db, 'orders'),
        where('deliveryBoyId', '==', deliveryBoyId)
      )
      
      const querySnapshot = await getDocs(ordersQuery)
      console.log(`Total orders found: ${querySnapshot.size}`)
      
      let totalDeliveries = 0
      let todayDeliveries = 0
      let totalEarnings = 0
      let totalDeliveryTime = 0
      let deliveredCount = 0
      
      querySnapshot.forEach(doc => {
        const order = doc.data()
        const orderDate = order.deliveredAt?.toDate?.() || 
                         (order.deliveredAt ? new Date(order.deliveredAt) : null)
        
        // Count all delivered orders
        if (order.status === 'delivered') {
          totalDeliveries++
          
          // Check if delivered today
          if (orderDate && orderDate >= today && orderDate < tomorrow) {
            todayDeliveries++
            console.log(`✅ Today's delivery: ${order.orderNumber || doc.id} at ${orderDate}`)
          }
          
          // Calculate delivery time for average
          if (order.assignedAt && order.deliveredAt) {
            const assignedTime = order.assignedAt?.toDate?.() || new Date(order.assignedAt)
            const deliveredTime = order.deliveredAt?.toDate?.() || new Date(order.deliveredAt)
            const deliveryTime = (deliveredTime - assignedTime) / (1000 * 60) // in minutes
            totalDeliveryTime += deliveryTime
            deliveredCount++
          }
          
          // Add earnings (delivery fee)
          totalEarnings += order.deliveryFee || 0
        }
      })
      
      const averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0
      
      // Get current active orders
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('deliveryBoyId', '==', deliveryBoyId),
        where('status', 'in', ['assigned', 'picked_up', 'on_the_way'])
      )
      const activeSnapshot = await getDocs(activeOrdersQuery)
      const activeOrders = activeSnapshot.size
      
      console.log('Stats calculated:', {
        totalDeliveries,
        todayDeliveries,
        totalEarnings,
        averageDeliveryTime,
        activeOrders
      })
      
      // Get delivery boy's rating from user document
      const userRef = doc(db, 'users', deliveryBoyId)
      const userDoc = await getDoc(userRef)
      const rating = userDoc.exists() ? (userDoc.data().rating || 4.5) : 4.5
      
      const stats = {
        totalDeliveries,
        todayDeliveries,
        totalEarnings,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
        activeOrders,
        rating
      }
      
      console.log('Final stats:', stats)
      return stats
      
    } catch (error) {
      console.error('Error fetching delivery stats:', error)
      return {
        totalDeliveries: 0,
        todayDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0,
        activeOrders: 0,
        rating: 4.5
      }
    }
  },

  async updateDeliveryLocation(deliveryBoyId, location) {
    try {
      const deliveryBoyRef = doc(db, 'users', deliveryBoyId)
      await updateDoc(deliveryBoyRef, {
        currentLocation: location,
        lastLocationUpdate: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating location:', error)
      throw new Error('Failed to update location')
    }
  },

  calculateAverageDeliveryTime(orders) {
    const deliveredOrders = orders.filter(o => 
      o.status === 'delivered' && 
      o.assignedAt && 
      o.deliveredAt
    )

    if (deliveredOrders.length === 0) return 0

    const totalTime = deliveredOrders.reduce((sum, o) => {
      const assignedTime = o.assignedAt?.toDate?.() || new Date(o.assignedAt)
      const deliveredTime = o.deliveredAt?.toDate?.() || new Date(o.deliveredAt)
      return sum + (deliveredTime - assignedTime)
    }, 0)

    return totalTime / deliveredOrders.length / (1000 * 60) // Return in minutes
  },

  subscribeToAssignedOrders(deliveryBoyId, callback) {
    const q = query(
      collection(db, 'orders'),
      where('deliveryBoyId', '==', deliveryBoyId),
      where('status', 'in', ['assigned', 'picked_up', 'on_the_way'])
    )

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(orders)
    })
  }
}