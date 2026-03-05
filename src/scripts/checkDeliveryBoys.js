import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkDeliveryBoys() {
  console.log('🔍 CHECKING DELIVERY BOYS IN DATABASE')
  console.log('======================================')
  
  try {
    // Get all users with role = 'delivery'
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'delivery')
    )
    
    const snapshot = await getDocs(q)
    
    console.log(`📊 Total delivery boys found: ${snapshot.size}`)
    console.log('')
    
    if (snapshot.empty) {
      console.log('❌ No delivery boys found in database!')
      console.log('')
      console.log('To create delivery boys:')
      console.log('1. Run: npm run create:delivery')
      console.log('2. Or register users with role="delivery" in the app')
      return
    }
    
    // List all delivery boys with their details
    snapshot.forEach(doc => {
      const boy = doc.data()
      console.log(`👤 ${boy.name || 'Unnamed'}`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Email: ${boy.email || 'N/A'}`)
      console.log(`  Status: ${boy.status || 'not set'}`)
      console.log(`  isActive: ${boy.isActive !== false ? '✅' : '❌'}`)
      console.log(`  Current Orders: ${boy.currentOrders || 0}/3`)
      console.log(`  Vehicle: ${boy.vehicleType || 'N/A'}`)
      console.log(`  Cycle Progress: ${boy.cycleDeliveries || 0}/${boy.cyclesCompleted ? ' (completed ' + boy.cyclesCompleted + ' cycles)' : '5'}`)
      console.log(`  Total Deliveries: ${boy.totalDeliveries || 0}`)
      console.log('  ---')
    })
    
    // Check availability
    console.log('')
    console.log('🎯 AVAILABILITY CHECK:')
    console.log('')
    
    let availableCount = 0
    snapshot.forEach(doc => {
      const boy = doc.data()
      const currentOrders = boy.currentOrders || 0
      const isActive = boy.isActive !== false
      const status = boy.status || 'active'
      
      const isAvailable = isActive && 
                         status === 'active' && 
                         currentOrders < 3
      
      if (isAvailable) {
        availableCount++
        console.log(`✅ ${boy.name || 'Unnamed'} is AVAILABLE (${currentOrders}/3 orders)`)
      } else {
        console.log(`❌ ${boy.name || 'Unnamed'} is NOT available`)
        console.log(`   Reasons:`, {
          isActive,
          status,
          currentOrders
        })
      }
    })
    
    console.log('')
    console.log('📊 SUMMARY')
    console.log('===========')
    console.log(`Total Delivery Boys: ${snapshot.size}`)
    console.log(`Available for Assignment: ${availableCount}`)
    console.log(`Busy/Unavailable: ${snapshot.size - availableCount}`)
    
  } catch (error) {
    console.error('❌ Error checking delivery boys:', error)
  }
}

checkDeliveryBoys()