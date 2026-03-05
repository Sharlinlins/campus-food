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

// Update the updateDeliveryBoyAfterDelivery function to work with the cycle
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