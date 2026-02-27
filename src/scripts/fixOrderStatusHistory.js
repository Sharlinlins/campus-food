// Use .js extension for imports in Node.js scripts
import { db } from '../services/firebase.js'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

async function fixOrderStatusHistory() {
  console.log('🔧 Fixing order status history...')
  console.log('==================================')
  
  const orderId = 'LgBRTGns8MwDQ5xlL0HA' // The problematic order
  
  try {
    console.log(`Looking for order: ${orderId}`)
    const orderRef = doc(db, 'orders', orderId)
    const orderDoc = await getDoc(orderRef)
    
    if (!orderDoc.exists()) {
      console.log('❌ Order not found')
      return
    }
    
    const orderData = orderDoc.data()
    console.log('✅ Order found')
    console.log('Current order data:', JSON.stringify(orderData, null, 2))
    
    // Fix status history - replace any serverTimestamp with actual timestamps
    const fixedHistory = (orderData.statusHistory || []).map((entry, index) => {
      console.log(`Entry ${index}:`, entry)
      
      // If entry has a timestamp that's not a string, replace it
      if (entry.timestamp && typeof entry.timestamp !== 'string') {
        console.log(`  ⚠️ Found non-string timestamp, replacing...`)
        return {
          ...entry,
          timestamp: new Date().toISOString()
        }
      }
      return entry
    })
    
    console.log('Fixed history:', JSON.stringify(fixedHistory, null, 2))
    
    // Update the order with fixed history
    await updateDoc(orderRef, {
      statusHistory: fixedHistory
    })
    
    console.log('✅ Order fixed successfully')
    
    // Verify the fix
    const verifiedDoc = await getDoc(orderRef)
    console.log('Verified order data:', JSON.stringify(verifiedDoc.data(), null, 2))
    
  } catch (error) {
    console.error('❌ Error fixing order:', error)
  }
}

// Run the function
fixOrderStatusHistory()