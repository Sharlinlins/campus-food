import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function resetDeliveryBoyCounters() {
  console.log('🔄 RESETTING DELIVERY BOY COUNTERS')
  console.log('===================================')
  
  try {
    // Get all delivery boys
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'delivery')
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log('❌ No delivery boys found')
      return
    }
    
    console.log(`📊 Found ${snapshot.size} delivery boys`)
    
    for (const docSnap of snapshot.docs) {
      const boy = docSnap.data()
      const boyRef = doc(db, 'users', docSnap.id)
      
      // Count actual active orders
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('deliveryBoyId', '==', docSnap.id),
        where('status', 'in', ['assigned', 'picked_up', 'on_the_way'])
      )
      
      const activeSnapshot = await getDocs(activeOrdersQuery)
      const actualActiveOrders = activeSnapshot.size
      
      console.log(`\n👤 ${boy.name || 'Unnamed'}:`)
      console.log(`  Current in DB: ${boy.currentOrders || 0}`)
      console.log(`  Actual active orders: ${actualActiveOrders}`)
      
      if ((boy.currentOrders || 0) !== actualActiveOrders) {
        console.log(`  ⚠️ Mismatch detected! Fixing...`)
        
        await updateDoc(boyRef, {
          currentOrders: actualActiveOrders,
          status: actualActiveOrders >= 3 ? 'busy' : 'active',
          updatedAt: new Date().toISOString()
        })
        
        console.log(`  ✅ Reset to ${actualActiveOrders}`)
      } else {
        console.log(`  ✅ Correct`)
      }
    }
    
    console.log('\n✅ All counters synced!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

resetDeliveryBoyCounters()