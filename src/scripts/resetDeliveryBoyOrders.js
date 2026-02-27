import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

// Initialize Firebase for Node.js
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function resetDeliveryBoyOrders() {
  console.log('🔄 Resetting delivery boy orders...')
  console.log('====================================')
  
  const deliveryBoyId = 'kLTDldn001NFC0vkiWqs3B42QXz1' // Mike's ID
  
  try {
    console.log(`Looking for delivery boy with ID: ${deliveryBoyId}`)
    const boyRef = doc(db, 'users', deliveryBoyId)
    const boyDoc = await getDoc(boyRef)
    
    if (!boyDoc.exists()) {
      console.log('❌ Delivery boy not found')
      console.log('Available delivery boys:')
      
      // List all delivery boys to help debug
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const q = query(collection(db, 'users'), where('role', '==', 'delivery'))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        console.log('  No delivery boys found in database')
      } else {
        snapshot.forEach(doc => {
          const data = doc.data()
          console.log(`  - ${data.name || 'Unnamed'}: ${doc.id}`)
        })
      }
      return
    }
    
    const boyData = boyDoc.data()
    console.log('Current data:', {
      name: boyData.name,
      email: boyData.email,
      currentOrders: boyData.currentOrders,
      status: boyData.status,
      isActive: boyData.isActive
    })
    
    // Reset to 0
    await updateDoc(boyRef, {
      currentOrders: 0,
      status: 'active',
      updatedAt: new Date().toISOString()
    })
    
    console.log('✅ Reset successful!')
    console.log(`${boyData.name} can now accept new deliveries (0/3 orders)`)
    
  } catch (error) {
    console.error('❌ Error resetting orders:', error)
  }
}

resetDeliveryBoyOrders()