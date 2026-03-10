import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,  // This was missing
  updateDoc 
} from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function addPhoneToOrders() {
  console.log('📱 Adding phone numbers to orders...')
  console.log('==================================')
  
  try {
    // Get all orders
    const ordersRef = collection(db, 'orders')
    const snapshot = await getDocs(ordersRef)
    
    console.log(`📊 Total orders found: ${snapshot.size}`)
    
    let updated = 0
    let skipped = 0
    let noUserPhone = 0
    
    for (const docSnap of snapshot.docs) {
      const order = docSnap.data()
      const orderId = docSnap.id
      
      console.log(`\n📦 Processing order ${orderId.slice(-8)}...`)
      
      // Check if order already has phone
      if (order.userPhone) {
        console.log(`  ✅ Already has phone: ${order.userPhone}`)
        skipped++
        continue
      }
      
      // Try to get phone from user document
      if (order.userId) {
        console.log(`  🔍 Looking up user: ${order.userId}`)
        const userRef = doc(db, 'users', order.userId)
        const userSnap = await getDoc(userRef)  // Now getDoc is defined
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          const userPhone = userData.phone
          
          if (userPhone) {
            // Update order with user's phone
            await updateDoc(docSnap.ref, {
              userPhone: userPhone,
              updatedAt: new Date().toISOString()
            })
            console.log(`  ✅ Added phone ${userPhone} to order`)
            updated++
          } else {
            console.log(`  ❌ User has no phone number`)
            noUserPhone++
          }
        } else {
          console.log(`  ❌ User document not found`)
          skipped++
        }
      } else {
        console.log(`  ❌ Order has no userId`)
        skipped++
      }
    }
    
    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`✅ Updated: ${updated} orders`)
    console.log(`❌ Users with no phone: ${noUserPhone}`)
    console.log(`⏭️ Skipped: ${skipped} orders`)
    
    if (noUserPhone > 0) {
      console.log('\n⚠️ Some users dont have phone numbers in their profiles.')
      console.log('Users should add their phone numbers in the Profile page.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addPhoneToOrders()