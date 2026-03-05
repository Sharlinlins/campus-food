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
      
      // Get ALL delivery boys - we'll filter in code for maximum flexibility
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'delivery')
      )
      
      const querySnapshot = await getDocs(q)
      console.log(`📊 Total delivery boys in database: ${querySnapshot.size}`)
      
      if (querySnapshot.empty) {
        console.log('❌ No delivery boys found in database')
        return []
      }
      
      // Log each delivery boy for debugging
      querySnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`Found delivery boy:`, {
          id: doc.id,
          name: data.name,
          email: data.email,
          status: data.status,
          isActive: data.isActive,
          currentOrders: data.currentOrders
        })
      })
      
      const availableBoys = []
      
      querySnapshot.forEach(doc => {
        const boyData = doc.data()
        
        // Default values if fields are missing
        const isActive = boyData.isActive !== false // Default to true if not set
        const status = boyData.status || 'active' // Default to active if not set
        const currentOrders = boyData.currentOrders || 0
        const hasRequiredFields = boyData.name && boyData.email
        
        // A boy is available if:
        // 1. isActive is true (or not set)
        // 2. status is 'active' (or not set)
        // 3. currentOrders < 3
        // 4. Has required fields (name, email)
        const isAvailable = isActive && 
                           status === 'active' && 
                           currentOrders < 3 &&
                           hasRequiredFields
        
        if (isAvailable) {
          availableBoys.push({
            id: doc.id,
            name: boyData.name,
            email: boyData.email,
            phone: boyData.phone || '',
            vehicleType: boyData.vehicleType || 'bike',
            currentOrders,
            status: 'active',
            isActive: true
          })
          console.log(`  ✅ Available: ${boyData.name} (orders: ${currentOrders}/3)`)
        } else {
          console.log(`  ❌ Not available: ${boyData.name || 'Unnamed'}`, {
            reason: !isActive ? 'inactive' : 
                    status !== 'active' ? `status=${status}` :
                    currentOrders >= 3 ? `orders=${currentOrders}` :
                    !hasRequiredFields ? 'missing name/email' : 'unknown'
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

  // Function to get delivery boy by ID
  async getDeliveryBoyById(deliveryBoyId) {
    try {
      const docRef = doc(db, 'users', deliveryBoyId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching delivery boy:', error)
      return null
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
      
      let totalDeliveries = 0
      let todayDeliveries = 0
      let totalEarnings = 0
      let totalDeliveryTime = 0
      let deliveredCount = 0
      
      querySnapshot.forEach(doc => {
        const order = doc.data()
        
        // Handle different date formats
        let deliveredDate = null
        if (order.deliveredAt) {
          if (typeof order.deliveredAt.toDate === 'function') {
            deliveredDate = order.deliveredAt.toDate()
          } else if (order.deliveredAt instanceof Date) {
            deliveredDate = order.deliveredAt
          } else if (typeof order.deliveredAt === 'string') {
            deliveredDate = new Date(order.deliveredAt)
          }
        }
        
        if (order.status === 'delivered') {
          totalDeliveries++
          
          if (deliveredDate && deliveredDate >= today && deliveredDate < tomorrow) {
            todayDeliveries++
          }
          
          // Calculate delivery time for average
          if (order.assignedAt && order.deliveredAt) {
            let assignedTime = null
            if (typeof order.assignedAt.toDate === 'function') {
              assignedTime = order.assignedAt.toDate()
            } else if (order.assignedAt instanceof Date) {
              assignedTime = order.assignedAt
            } else if (typeof order.assignedAt === 'string') {
              assignedTime = new Date(order.assignedAt)
            }
            
            if (assignedTime && deliveredDate) {
              const deliveryTime = (deliveredDate - assignedTime) / (1000 * 60) // minutes
              totalDeliveryTime += deliveryTime
              deliveredCount++
            }
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
      
      // Get delivery boy's user data for cycle info
      const userRef = doc(db, 'users', deliveryBoyId)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      const stats = {
        totalDeliveries,
        todayDeliveries,
        totalEarnings,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
        activeOrders,
        rating: userData.rating || 4.5,
        cycleDeliveries: userData.cycleDeliveries || 0,
        cyclesCompleted: userData.cyclesCompleted || 0
      }
      
      console.log('Stats calculated:', stats)
      return stats
      
    } catch (error) {
      console.error('Error fetching delivery stats:', error)
      return {
        totalDeliveries: 0,
        todayDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0,
        activeOrders: 0,
        rating: 4.5,
        cycleDeliveries: 0,
        cyclesCompleted: 0
      }
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