import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkDeliveryBoyOrders() {
  const deliveryBoyId = 'kLTDldn001NFC0vkiWqs3B42QXz1' // Mike's ID
  
  console.log('🔍 Checking orders for delivery boy:', deliveryBoyId)
  console.log('==========================================')
  
  try {
    // First, verify the delivery boy exists
    const { doc, getDoc } = await import('firebase/firestore')
    const boyRef = doc(db, 'users', deliveryBoyId)
    const boyDoc = await getDoc(boyRef)
    
    if (!boyDoc.exists()) {
      console.log('❌ Delivery boy not found with ID:', deliveryBoyId)
      return
    }
    
    const boyData = boyDoc.data()
    console.log('Delivery Boy:', boyData.name)
    console.log('Current orders counter:', boyData.currentOrders || 0)
    console.log('')
    
    // Check all orders assigned to Mike
    const ordersQuery = query(
      collection(db, 'orders'),
      where('deliveryBoyId', '==', deliveryBoyId)
    )
    
    const snapshot = await getDocs(ordersQuery)
    
    console.log(`Total orders assigned: ${snapshot.size}`)
    console.log('')
    
    let activeCount = 0
    
    if (snapshot.empty) {
      console.log('No orders found for this delivery boy')
    } else {
      snapshot.forEach(doc => {
        const order = doc.data()
        const status = order.status
        const isActive = ['assigned', 'picked_up', 'on_the_way'].includes(status)
        
        if (isActive) activeCount++
        
        console.log(`Order: ${order.orderNumber || doc.id.slice(-8)}`)
        console.log(`  Status: ${status} ${isActive ? '(ACTIVE)' : '(COMPLETED)'}`)
        console.log(`  Created: ${order.createdAt?.toDate?.() || order.createdAt || 'N/A'}`)
        console.log('  ---')
      })
    }
    
    console.log('')
    console.log(`📊 ACTIVE ORDERS: ${activeCount}`)
    console.log(`📊 COMPLETED ORDERS: ${snapshot.size - activeCount}`)
    console.log(`📊 COUNTER IN DB: ${boyData.currentOrders || 0}`)
    
    if (activeCount === 0 && (boyData.currentOrders || 0) > 0) {
      console.log('\n⚠️ MISMATCH DETECTED:')
      console.log(`   Active orders: ${activeCount}`)
      console.log(`   Counter in DB: ${boyData.currentOrders}`)
      console.log('\n✅ Run this to fix: npm run reset:mike')
    } else if (activeCount > 0) {
      console.log('\n⚠️ These active orders are keeping the delivery boy busy:')
      console.log('Complete or cancel them to free up capacity')
    } else {
      console.log('\n✅ All good! Counter matches active orders.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDeliveryBoyOrders()