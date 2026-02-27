import React, { useState, useEffect } from 'react'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import RevenueChart from '../../components/charts/RevenueChart'
import MostSoldPie from '../../components/charts/MostSoldPie'
import OrdersTrendLine from '../../components/charts/OrdersTrendLine'
import DeliveryPerformanceChart from '../../components/charts/DeliveryPerformanceChart'
import { analyticsService } from '../../services/analyticsService'
import { formatCurrency, formatNumber } from '../../utils/formatDate'
import { CalendarIcon, ArrowTrendingUpIcon, UsersIcon, TruckIcon } from '@heroicons/react/24/outline'

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('week')
  const [revenueData, setRevenueData] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [ordersTrend, setOrdersTrend] = useState([])
  const [deliveryData, setDeliveryData] = useState([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Get revenue analytics
      const revenue = await analyticsService.getRevenueAnalytics(period)
      setRevenueData(revenue.chartData || [])
      
      // Get popular items
      const popular = await analyticsService.getPopularItems(5)
      setPopularItems(popular)
      
      // Get orders trend
      const trend = await analyticsService.getOrdersTrend(period)
      setOrdersTrend(trend)
      
      // Get delivery performance
      const delivery = await analyticsService.getDeliveryPerformance()
      setDeliveryData(delivery)
      
      // Get dashboard stats for summary
      const stats = await analyticsService.getDashboardStats()
      
      setSummary({
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.avgOrderValue,
        totalCustomers: stats.totalUsers
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
            <p className="text-gray-600">Detailed insights and reports</p>
          </div>
          
          {/* Period selector */}
          <div className="flex space-x-2">
            {['day', 'week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  period === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">↑ 12.5% from last {period}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatNumber(summary.totalOrders)}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">↑ 8.2% from last {period}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(summary.averageOrderValue)}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">↑ 3.1% from last {period}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatNumber(summary.totalCustomers)}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">↑ 5.7% from last {period}</p>
          </GlassCard>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="space-y-8">
            <div className="animate-pulse h-80 bg-gray-300 rounded-xl"></div>
            <div className="animate-pulse h-80 bg-gray-300 rounded-xl"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <RevenueChart data={revenueData} title={`Revenue (${period})`} />
              <MostSoldPie data={popularItems} title="Top Selling Items" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <OrdersTrendLine data={ordersTrend} title="Orders Trend" />
              <DeliveryPerformanceChart data={deliveryData} title="Delivery Performance" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics