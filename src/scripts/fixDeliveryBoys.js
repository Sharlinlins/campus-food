import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function fixDeliveryBoys() {
  console.log('🔧 FIXING DELIVERY BOYS')
  console.log('=======================')
  
  try {
    // Get all delivery boys
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'delivery')
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log('❌ No delivery boys found.')
      console.log('Run createMoreDeliveryBoys.js first')
      return
    }
    
    console.log(`📊 Found ${snapshot.size} delivery boys`)
    
    let fixedCount = 0
    
    for (const docSnap of snapshot.docs) {
      const boy = docSnap.data()
      const boyRef = doc(db, 'users', docSnap.id)
      
      console.log(`\nChecking ${boy.name || 'Unnamed'}...`)
      
      const updates = {}
      const requiredFields = {
        status: 'active',
        isActive: true,
        currentOrders: 0,
        cycleDeliveries: 0,
        cyclesCompleted: 0,
        totalEarnings: 0
      }
      
      // Check each required field
      for (const [field, defaultValue] of Object.entries(requiredFields)) {
        if (!boy.hasOwnProperty(field)) {
          updates[field] = defaultValue
          console.log(`  ➕ Adding missing field: ${field} = ${defaultValue}`)
        }
      }
      
      // Fix incorrect values
      if (boy.isActive === false) {
        updates.isActive = true
        console.log(`  🔄 Fixing isActive: false → true`)
      }
      
      if (boy.status !== 'active') {
        updates.status = 'active'
        console.log(`  🔄 Fixing status: ${boy.status || 'undefined'} → active`)
      }
      
      // Ensure currentOrders is a number
      if (typeof boy.currentOrders !== 'number') {
        updates.currentOrders = 0
        console.log(`  🔄 Fixing currentOrders type`)
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await updateDoc(boyRef, {
          ...updates,
          updatedAt: new Date().toISOString()
        })
        console.log(`  ✅ Fixed ${boy.name || docSnap.id}`)
        fixedCount++
      } else {
        console.log(`  ✅ No fixes needed`)
      }
    }
    
    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`✅ Fixed: ${fixedCount} delivery boys`)
    console.log(`📊 Total: ${snapshot.size} delivery boys`)
    
  } catch (error) {
    console.error('❌ Error fixing delivery boys:', error)
  }
}

fixDeliveryBoys()