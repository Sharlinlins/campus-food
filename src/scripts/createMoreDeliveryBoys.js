import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { firebaseConfig } from './config.js'

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
      phone: '+1234567894',
      vehicleType: 'scooter'
    },
    {
      email: 'delivery.raj@example.com',
      password: 'password123',
      name: 'Raj Kumar',
      phone: '+1234567895',
      vehicleType: 'bike'
    },
    {
      email: 'delivery.priya@example.com',
      password: 'password123',
      name: 'Priya Sharma',
      phone: '+1234567896',
      vehicleType: 'bike'
    }
  ]

  for (const boy of newDeliveryBoys) {
    try {
      console.log(`\nCreating ${boy.name} (${boy.email})...`)
      
      // Create in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        boy.email,
        boy.password
      )
      
      console.log(`✅ Auth user created with UID: ${userCred.user.uid}`)
      
      // Create in Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: boy.email,
        name: boy.name,
        role: 'delivery',
        phone: boy.phone,
        vehicleType: boy.vehicleType,
        status: 'active',
        currentOrders: 0,
        totalDeliveries: 0,
        rating: 5.0,
        isActive: true,
        createdAt: new Date().toISOString()
      })
      
      console.log(`✅ Firestore document created for ${boy.name}`)
      console.log(`✅ Created: ${boy.name} (${boy.email} / ${boy.password})`)
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Already exists: ${boy.email}`)
      } else {
        console.error(`❌ Failed to create ${boy.email}:`, error.message)
        console.error('Error code:', error.code)
      }
    }
  }
  
  console.log('\n📋 Summary:')
  console.log('New delivery boys created/verified:')
  console.log('- Sarah Johnson: delivery.sarah@example.com / password123')
  console.log('- Raj Kumar: delivery.raj@example.com / password123')
  console.log('- Priya Sharma: delivery.priya@example.com / password123')
}

createMoreDeliveryBoys()