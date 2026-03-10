import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import RevenueChart from '../../components/charts/RevenueChart'
import MostSoldPie from '../../components/charts/MostSoldPie'
import OrdersTrendLine from '../../components/charts/OrdersTrendLine'
import ExportModal from '../../components/admin/ExportModal'
import { orderService } from '../../services/orderService'
import { exportService } from '../../services/exportService'
import { db } from '../../services/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  TruckIcon,
  ClockIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatNumber } from '../../utils/formatDate'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState('orders')
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalDeliveryBoys: 0,
    activeDeliveryBoys: 0,
    pendingOrders: 0,
    avgOrderValue: 0,
    todayOrders: 0,
    todayRevenue: 0
  })
  
  const [revenueData, setRevenueData] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [ordersTrend, setOrdersTrend] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'))
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setOrders(ordersData)

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(usersData)

      // Calculate stats
      const totalOrders = ordersData.length
      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // User stats
      const totalUsers = usersData.filter(u => u.role === 'student').length
      const totalDeliveryBoys = usersData.filter(u => u.role === 'delivery').length
      const activeDeliveryBoys = usersData.filter(u => u.role === 'delivery' && u.status === 'active').length

      // Today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders = ordersData.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
        return orderDate >= today
      })
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)

      setStats({
        totalOrders,
        totalRevenue,
        totalUsers,
        totalDeliveryBoys,
        activeDeliveryBoys,
        pendingOrders,
        avgOrderValue,
        todayOrders: todayOrders.length,
        todayRevenue
      })

      // Generate revenue data for chart (last 7 days)
      const last7Days = generateLast7DaysData(ordersData)
      setRevenueData(last7Days)

      // Get popular items
      const popular = await getPopularItems(ordersData)
      setPopularItems(popular)

      // Generate orders trend
      const trend = generateOrdersTrend(ordersData)
      setOrdersTrend(trend)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const generateLast7DaysData = (orders) => {
    const data = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
        return orderDate >= date && orderDate < nextDate
      })
      
      const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: revenue
      })
    }
    
    return data
  }

  const getPopularItems = async (orders) => {
    const itemCount = {}
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemName = item.name || 'Unknown Item'
          itemCount[itemName] = (itemCount[itemName] || 0) + (item.quantity || 1)
        })
      }
    })
    
    const popular = Object.entries(itemCount)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    
    return popular.length > 0 ? popular : [
      { name: 'No Data', value: 1 }
    ]
  }

  const generateOrdersTrend = (orders) => {
    const data = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
        return orderDate >= date && orderDate < nextDate
      })
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: dayOrders.length
      })
    }
    
    return data
  }

  const handleExport = async (options) => {
    try {
      toast.loading('Preparing export...', { id: 'export' })

      let reportData = []
      let filename = ''
      let title = ''

      switch(exportType) {
        case 'orders':
          reportData = exportService.prepareOrdersReport(orders)
          filename = 'orders_report'
          title = 'Orders Report'
          break
        case 'revenue':
          reportData = exportService.prepareRevenueReport(orders)
          filename = 'revenue_report'
          title = 'Revenue Report'
          break
        case 'delivery':
          reportData = exportService.prepareDeliveryReport(orders)
          filename = 'delivery_report'
          title = 'Delivery Performance Report'
          break
        case 'users':
          reportData = exportService.prepareUserReport(users)
          filename = 'users_report'
          title = 'Users Report'
          break
        case 'items':
          reportData = exportService.preparePopularItemsReport(popularItems)
          filename = 'popular_items_report'
          title = 'Popular Items Report'
          break
        default:
          reportData = exportService.prepareOrdersReport(orders)
          filename = 'report'
          title = 'Report'
      }

      // Apply date filtering if needed
      if (options.dateRange !== 'all') {
        // Add date filtering logic here
        // This would filter reportData based on date range
      }

      // Export based on format
      switch(options.format) {
        case 'excel':
          exportService.exportToExcel(reportData, filename)
          break
        case 'csv':
          exportService.exportToCSV(reportData, filename)
          break
        case 'pdf':
          exportService.exportToPDF(reportData, title, filename)
          break
        default:
          exportService.exportToExcel(reportData, filename)
      }

      toast.success('Export completed successfully!', { id: 'export' })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.', { id: 'export' })
    }
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subValue: `Today: ${formatCurrency(stats.todayRevenue)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      link: '/admin/analytics'
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      subValue: `Today: ${formatNumber(stats.todayOrders)}`,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.totalUsers),
      subValue: 'Students',
      icon: UsersIcon,
      color: 'bg-purple-500',
      link: '/admin/users'
    },
    {
      title: 'Active Deliveries',
      value: `${stats.activeDeliveryBoys}/${stats.totalDeliveryBoys}`,
      subValue: `${stats.totalDeliveryBoys - stats.activeDeliveryBoys} offline`,
      icon: TruckIcon,
      color: 'bg-orange-500',
      link: '/admin/delivery-boys'
    },
    {
      title: 'Pending Orders',
      value: formatNumber(stats.pendingOrders),
      subValue: 'Awaiting confirmation',
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/admin/orders?status=pending'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(stats.avgOrderValue),
      subValue: 'Per order',
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
      link: '/admin/analytics'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-xl"></div>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors flex items-center gap-2">
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export Report
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 hidden group-hover:block z-10">
                <button
                  onClick={() => { setExportType('orders'); setExportModalOpen(true); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📦 Orders Report
                </button>
                <button
                  onClick={() => { setExportType('revenue'); setExportModalOpen(true); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  💰 Revenue Report
                </button>
                <button
                  onClick={() => { setExportType('delivery'); setExportModalOpen(true); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🚚 Delivery Report
                </button>
                <button
                  onClick={() => { setExportType('users'); setExportModalOpen(true); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  👥 Users Report
                </button>
                <button
                  onClick={() => { setExportType('items'); setExportModalOpen(true); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🔥 Popular Items Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link to={stat.link} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 hover:shadow-xl transition-all hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueChart data={revenueData} title="Weekly Revenue" />
          <MostSoldPie data={popularItems} title="Most Popular Items" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <OrdersTrendLine data={ordersTrend} title="Orders Trend (Last 7 Days)" />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/admin/menu">
              <GlassCard className="p-4 text-center hover:bg-white/40 cursor-pointer">
                <h3 className="font-semibold">📝 Manage Menu</h3>
                <p className="text-sm text-gray-500">Add or update food items</p>
              </GlassCard>
            </Link>
            <Link to="/admin/orders">
              <GlassCard className="p-4 text-center hover:bg-white/40 cursor-pointer">
                <h3 className="font-semibold">📦 View Orders</h3>
                <p className="text-sm text-gray-500">{stats.pendingOrders} pending</p>
              </GlassCard>
            </Link>
            <Link to="/admin/delivery-boys">
              <GlassCard className="p-4 text-center hover:bg-white/40 cursor-pointer">
                <h3 className="font-semibold">🚚 Delivery Personnel</h3>
                <p className="text-sm text-gray-500">{stats.activeDeliveryBoys} active</p>
              </GlassCard>
            </Link>
            <Link to="/admin/analytics">
              <GlassCard className="p-4 text-center hover:bg-white/40 cursor-pointer">
                <h3 className="font-semibold">📊 Analytics</h3>
                <p className="text-sm text-gray-500">View detailed reports</p>
              </GlassCard>
            </Link>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Today's Summary</h2>
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{stats.todayOrders}</p>
                <p className="text-sm text-gray-500">Orders Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-sm text-gray-500">Revenue Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-500">Pending Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.activeDeliveryBoys}</p>
                <p className="text-sm text-gray-500">Active Delivery</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        title={`Export ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`}
      />
    </div>
  )
}

export default AdminDashboard