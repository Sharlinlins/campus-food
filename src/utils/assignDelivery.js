import { deliveryService } from '../services/deliveryService'
import { orderService } from '../services/orderService'

export const assignDelivery = async (orderId) => {
  try {
    // Get available delivery boys
    const availableBoys = await deliveryService.getAvailableDeliveryBoys()
    
    if (availableBoys.length === 0) {
      throw new Error('No delivery boys available')
    }

    // Simple round-robin assignment
    // In production, you might want more sophisticated logic
    const randomIndex = Math.floor(Math.random() * availableBoys.length)
    const selectedBoy = availableBoys[randomIndex]

    // Assign the order
    await orderService.assignDeliveryBoy(orderId, selectedBoy.id)

    return selectedBoy.id
  } catch (error) {
    console.error('Error assigning delivery:', error)
    throw error
  }
}