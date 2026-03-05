import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function addDeliveryCycleFields() {
  console.log('🔄 Adding delivery cycle fields to delivery boys...')
  
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    let updatedCount = 0
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data()
      
      if (userData.role === 'delivery') {
        const updates = {}
        
        // Add new fields if they don't exist
        if (!userData.hasOwnProperty('cycleDeliveries')) {
          updates.cycleDeliveries = 0
        }
        
        if (!userData.hasOwnProperty('cyclesCompleted')) {
          updates.cyclesCompleted = 0
        }
        
        if (!userData.hasOwnProperty('totalEarnings')) {
          updates.totalEarnings = userData.totalEarnings || 0
        }
        
        if (!userData.hasOwnProperty('lastCycleCompletedAt')) {
          updates.lastCycleCompletedAt = null
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', userDoc.id), updates)
          console.log(`✅ Updated ${userData.name || 'Unknown'} with cycle fields`)
          updatedCount++
        }
      }
    }
    
    console.log(`\n🎯 Added cycle fields to ${updatedCount} delivery boys`)
    
  } catch (error) {
    console.error('Error adding cycle fields:', error)
  }
}

addDeliveryCycleFields()