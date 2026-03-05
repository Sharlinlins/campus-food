import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

// Constants for delivery cycle (should match your orderService)
const DELIVERIES_PER_CYCLE = 5

// Initialize Firebase for Node.js
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createMoreDeliveryBoys() {
  console.log('👥 Creating additional delivery boys...')
  console.log('========================================')
  
  const newDeliveryBoys = [
    {
      email: 'delivery.sarah@example.com',
      password: 'password123',
      name: 'Sarah Johnson',
      phone: '+911234567894', // Updated to Indian format
      vehicleType: 'scooter'
    },
    {
      email: 'delivery.raj@example.com',
      password: 'password123',
      name: 'Raj Kumar',
      phone: '+911234567895', // Updated to Indian format
      vehicleType: 'bike'
    },
    {
      email: 'delivery.priya@example.com',
      password: 'password123',
      name: 'Priya Sharma',
      phone: '+911234567896', // Updated to Indian format
      vehicleType: 'bike'
    },
    {
      email: 'delivery.amit@example.com',
      password: 'password123',
      name: 'Amit Patel',
      phone: '+911234567897',
      vehicleType: 'bike'
    },
    {
      email: 'delivery.neha@example.com',
      password: 'password123',
      name: 'Neha Singh',
      phone: '+911234567898',
      vehicleType: 'scooter'
    }
  ]

  let createdCount = 0
  let existingCount = 0
  let failedCount = 0

  for (const boy of newDeliveryBoys) {
    try {
      console.log(`\n📝 Processing ${boy.name} (${boy.email})...`)
      
      // Create in Firebase Auth
      let userCred
      try {
        userCred = await createUserWithEmailAndPassword(
          auth,
          boy.email,
          boy.password
        )
        console.log(`✅ Auth user created with UID: ${userCred.user.uid}`)
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log(`⚠️ Email already exists: ${boy.email}`)
          existingCount++
          continue
        } else {
          throw authError
        }
      }
      
      // Create in Firestore with ALL required fields
      await setDoc(doc(db, 'users', userCred.user.uid), {
        // Basic Info
        uid: userCred.user.uid,
        email: boy.email,
        name: boy.name,
        role: 'delivery',
        phone: boy.phone,
        vehicleType: boy.vehicleType,
        
        // Status Fields
        status: 'active',
        isActive: true,
        currentOrders: 0,
        
        // Delivery Stats
        totalDeliveries: 0,
        rating: 5.0,
        
        // Cycle Tracking Fields (for the 5-delivery cycle)
        cycleDeliveries: 0,
        cyclesCompleted: 0,
        totalEarnings: 0,
        lastCycleCompletedAt: null,
        
        // Location Tracking
        currentLocation: null,
        lastLocationUpdate: null,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      console.log(`✅ Firestore document created for ${boy.name}`)
      console.log(`✅ Created: ${boy.name} (${boy.email} / ${boy.password})`)
      createdCount++
      
    } catch (error) {
      console.error(`❌ Failed to create ${boy.email}:`, error.message)
      console.error('Error code:', error.code)
      failedCount++
    }
  }
  
  console.log('\n📊 SUMMARY')
  console.log('===========')
  console.log(`✅ Created: ${createdCount} delivery boys`)
  console.log(`⚠️ Already existed: ${existingCount}`)
  console.log(`❌ Failed: ${failedCount}`)
  
  if (createdCount > 0) {
    console.log('\n🎉 New delivery boys created:')
    newDeliveryBoys.slice(0, createdCount).forEach(boy => {
      console.log(`- ${boy.name}: ${boy.email} / ${boy.password}`)
    })
  }
  
  console.log('\n💡 Next steps:')
  console.log('1. Check if they appear in Firebase Console')
  console.log('2. Try assigning an order in the admin panel')
  console.log('3. They should now appear in the "Assign Delivery" modal')
}

// Run the function
createMoreDeliveryBoys()