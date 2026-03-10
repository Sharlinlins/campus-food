import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  query,
  where
} from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function fixMissingPhoneNumbers() {
  console.log('📱 FIXING MISSING PHONE NUMBERS IN ORDERS')
  console.log('==========================================')
  
  try {
    // Get all orders without phone numbers
    const ordersRef = collection(db, 'orders')
    const ordersSnapshot = await getDocs(ordersRef)
    
    console.log(`📊 Total orders: ${ordersSnapshot.size}`)
    
    let fixed = 0
    let skipped = 0
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data()
      
      if (!order.userPhone && order.userId) {
        console.log(`\n🔍 Order ${orderDoc.id.slice(-8)} missing phone, looking up user...`)
        
        // Get user document
        const userRef = doc(db, 'users', order.userId)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const user = userSnap.data()
          const userPhone = user.phone || user.userPhone
          
          if (userPhone) {
            // Update order with user's phone
            await updateDoc(orderDoc.ref, {
              userPhone: userPhone,
              phoneFixedAt: new Date().toISOString()
            })
            console.log(`  ✅ Added phone ${userPhone} to order`)
            fixed++
          } else {
            console.log(`  ❌ User has no phone number`)
            skipped++
          }
        } else {
          console.log(`  ❌ User document not found`)
          skipped++
        }
      } else if (order.userPhone) {
        console.log(`\n✅ Order ${orderDoc.id.slice(-8)} already has phone: ${order.userPhone}`)
        skipped++
      }
    }
    
    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`✅ Fixed: ${fixed} orders`)
    console.log(`⏭️ Skipped: ${skipped} orders`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixMissingPhoneNumbers()