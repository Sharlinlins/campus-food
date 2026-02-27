export const calculateRevenue = (orders, period = 'day') => {
  const now = new Date()
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    
    switch(period) {
      case 'day':
        return orderDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        return orderDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
        return orderDate >= monthAgo
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
        return orderDate >= yearAgo
      default:
        return true
    }
  })

  const revenue = {
    total: 0,
    byPaymentMethod: {},
    byHour: {},
    averageOrderValue: 0
  }

  filteredOrders.forEach(order => {
    const amount = order.bill?.total || 0
    revenue.total += amount

    // Group by payment method
    const method = order.paymentMethod || 'unknown'
    revenue.byPaymentMethod[method] = (revenue.byPaymentMethod[method] || 0) + amount

    // Group by hour
    const hour = new Date(order.createdAt).getHours()
    revenue.byHour[hour] = (revenue.byHour[hour] || 0) + amount
  })

  revenue.averageOrderValue = filteredOrders.length > 0 
    ? revenue.total / filteredOrders.length 
    : 0

  return revenue
}