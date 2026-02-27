import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'

export const useOrders = (userId, role) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [userId, role])

  const fetchOrders = async () => {
    try {
      setError(null)
      const data = await orderService.getOrders(userId, role)
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (orderData) => {
    try {
      setError(null)
      const newOrder = await orderService.createOrder(orderData)
      await fetchOrders()
      return newOrder
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
      setError(null)
      await orderService.updateOrderStatus(orderId, status, additionalData)
      await fetchOrders()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getOrderById = async (orderId) => {
    try {
      setError(null)
      return await orderService.getOrderById(orderId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    getOrderById,
    refreshOrders: fetchOrders
  }
}