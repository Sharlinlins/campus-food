import { db } from './firebase'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'

export const analyticsService = {
  async getDashboardStats() {
    try {
      // Get all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate stats
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const pendingOrders = orders.filter(o => o.status === 'pending').length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // User stats
      const totalUsers = users.filter(u => u.role === 'student').length
      const totalDelivery = users.filter(u => u.role === 'delivery').length
      const activeDelivery = users.filter(u => u.role === 'delivery' && u.status === 'active').length

      // Today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
        return orderDate >= today
      })
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        avgOrderValue,
        totalUsers,
        totalDelivery,
        activeDelivery,
        todayOrders: todayOrders.length,
        todayRevenue
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        avgOrderValue: 0,
        totalUsers: 0,
        totalDelivery: 0,
        activeDelivery: 0,
        todayOrders: 0,
        todayRevenue: 0
      }
    }
  },

  async getRevenueAnalytics(period = 'week') {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Filter by period
      const now = new Date()
      let startDate = new Date()
      
      switch(period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          startDate.setDate(now.getDate() - 7)
      }

      const filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
        return orderDate >= startDate
      })

      const total = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      
      // Group by date
      const byDate = {}
      filteredOrders.forEach(order => {
        const date = (order.createdAt?.toDate?.() || new Date(order.createdAt)).toLocaleDateString()
        byDate[date] = (byDate[date] || 0) + (order.total || 0)
      })

      // Format for chart
      const chartData = Object.entries(byDate).map(([date, revenue]) => ({
        name: date,
        revenue
      })).slice(-7) // Last 7 entries

      return {
        total,
        byDate,
        count: filteredOrders.length,
        chartData: chartData.length > 0 ? chartData : [{ name: 'No Data', revenue: 0 }]
      }
    } catch (error) {
      console.error('Error getting revenue analytics:', error)
      return {
        total: 0,
        byDate: {},
        count: 0,
        chartData: [{ name: 'No Data', revenue: 0 }]
      }
    }
  },

  async getPopularItems(limit = 5) {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const itemCount = {}

      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data()
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name || 'Unknown'
            itemCount[name] = (itemCount[name] || 0) + (item.quantity || 1)
          })
        }
      })

      const popular = Object.entries(itemCount)
        .map(([name, count]) => ({ name, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)

      return popular.length > 0 ? popular : [{ name: 'No Data', value: 1 }]
    } catch (error) {
      console.error('Error getting popular items:', error)
      return [{ name: 'No Data', value: 1 }]
    }
  },

  async getOrdersTrend(period = 'week') {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const now = new Date()
      const chartData = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const dayOrders = orders.filter(order => {
          const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
          return orderDate >= date && orderDate < nextDate
        })
        
        chartData.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: dayOrders.length
        })
      }

      return chartData
    } catch (error) {
      console.error('Error getting orders trend:', error)
      return [
        { name: 'Mon', orders: 0 },
        { name: 'Tue', orders: 0 },
        { name: 'Wed', orders: 0 },
        { name: 'Thu', orders: 0 },
        { name: 'Fri', orders: 0 },
        { name: 'Sat', orders: 0 },
        { name: 'Sun', orders: 0 }
      ]
    }
  },

  async getDeliveryPerformance() {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const deliveredOrders = orders.filter(o => o.status === 'delivered')
      
      const performanceByDay = {}
      
      deliveredOrders.forEach(order => {
        const date = (order.createdAt?.toDate?.() || new Date(order.createdAt)).toLocaleDateString('en-US', { weekday: 'short' })
        
        if (!performanceByDay[date]) {
          performanceByDay[date] = { total: 0, onTime: 0 }
        }
        
        performanceByDay[date].total++
        
        // Check if delivered within 45 minutes of assignment
        if (order.assignedAt && order.deliveredAt) {
          const assignedTime = order.assignedAt.toDate?.() || new Date(order.assignedAt)
          const deliveredTime = order.deliveredAt.toDate?.() || new Date(order.deliveredAt)
          const deliveryTime = (deliveredTime - assignedTime) / (1000 * 60) // minutes
          
          if (deliveryTime <= 45) {
            performanceByDay[date].onTime++
          }
        }
      })

      const chartData = Object.entries(performanceByDay).map(([day, stats]) => ({
        name: day,
        onTime: Math.round((stats.onTime / stats.total) * 100) || 0,
        delayed: 100 - Math.round((stats.onTime / stats.total) * 100) || 0
      }))

      return chartData.length > 0 ? chartData : [
        { name: 'Mon', onTime: 0, delayed: 0 },
        { name: 'Tue', onTime: 0, delayed: 0 },
        { name: 'Wed', onTime: 0, delayed: 0 },
        { name: 'Thu', onTime: 0, delayed: 0 },
        { name: 'Fri', onTime: 0, delayed: 0 },
        { name: 'Sat', onTime: 0, delayed: 0 },
        { name: 'Sun', onTime: 0, delayed: 0 }
      ]
    } catch (error) {
      console.error('Error getting delivery performance:', error)
      return [
        { name: 'Mon', onTime: 0, delayed: 0 },
        { name: 'Tue', onTime: 0, delayed: 0 },
        { name: 'Wed', onTime: 0, delayed: 0 },
        { name: 'Thu', onTime: 0, delayed: 0 },
        { name: 'Fri', onTime: 0, delayed: 0 },
        { name: 'Sat', onTime: 0, delayed: 0 },
        { name: 'Sun', onTime: 0, delayed: 0 }
      ]
    }
  }
}