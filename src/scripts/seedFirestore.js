import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

// Your Firebase configuration (use your actual config from .env)
const firebaseConfig = {
  apiKey: "AIzaSyB5LovxIFL6CNYvD_PXP0ed12c3i8Qk0us",
  authDomain: "foodie-6bf63.firebaseapp.com",
  projectId: "foodie-6bf63",
  storageBucket: "foodie-6bf63.firebasestorage.app",
  messagingSenderId: "957132100428",
  appId: "1:957132100428:web:3d08f86c1333bd814c35e9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Sample Foods Data
const sampleFoods = [
  {
    name: "Margherita Pizza",
    description: "Classic Italian pizza with fresh mozzarella, tomato sauce, and basil",
    price: 12.99,
    category: "Pizza",
    cuisine: "Italian",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400",
    available: true,
    popular: true,
    featured: true,
    preparationTime: 20,
    calories: 850,
    vegetarian: true,
    vegan: false,
    glutenFree: false,
    spicyLevel: "mild",
    ingredients: ["pizza dough", "tomato sauce", "fresh mozzarella", "fresh basil", "olive oil"],
    tags: ["pizza", "italian", "vegetarian"],
    createdAt: new Date().toISOString()
  },
  {
    name: "Chicken Burger",
    description: "Grilled chicken patty with lettuce, tomato, and special sauce",
    price: 9.99,
    category: "Burgers",
    cuisine: "American",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
    available: true,
    popular: true,
    featured: true,
    preparationTime: 15,
    calories: 650,
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicyLevel: "medium",
    ingredients: ["chicken patty", "lettuce", "tomato", "onion", "special sauce", "brioche bun"],
    tags: ["burger", "chicken", "fast food"],
    createdAt: new Date().toISOString()
  },
  {
    name: "California Roll",
    description: "Crab stick, avocado, and cucumber rolled in sushi rice",
    price: 14.99,
    category: "Sushi",
    cuisine: "Japanese",
    image: "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=400",
    available: true,
    popular: true,
    featured: false,
    preparationTime: 25,
    calories: 450,
    vegetarian: false,
    vegan: false,
    glutenFree: true,
    spicyLevel: "mild",
    ingredients: ["sushi rice", "crab stick", "avocado", "cucumber", "nori", "sesame seeds"],
    tags: ["sushi", "japanese", "seafood"],
    createdAt: new Date().toISOString()
  },
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce, croutons, parmesan cheese with Caesar dressing",
    price: 8.99,
    category: "Salads",
    cuisine: "American",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400",
    available: true,
    popular: false,
    featured: false,
    preparationTime: 10,
    calories: 350,
    vegetarian: true,
    vegan: false,
    glutenFree: true,
    spicyLevel: "mild",
    ingredients: ["romaine lettuce", "croutons", "parmesan cheese", "caesar dressing"],
    tags: ["salad", "healthy", "vegetarian"],
    createdAt: new Date().toISOString()
  },
  {
    name: "Pad Thai",
    description: "Stir-fried rice noodles with eggs, tofu, and peanuts",
    price: 13.99,
    category: "Noodles",
    cuisine: "Thai",
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
    available: true,
    popular: true,
    featured: true,
    preparationTime: 18,
    calories: 550,
    vegetarian: true,
    vegan: false,
    glutenFree: false,
    spicyLevel: "medium",
    ingredients: ["rice noodles", "eggs", "tofu", "bean sprouts", "peanuts", "pad thai sauce"],
    tags: ["noodles", "thai", "asian"],
    createdAt: new Date().toISOString()
  },
  {
    name: "Chocolate Brownie",
    description: "Warm chocolate brownie with vanilla ice cream",
    price: 6.99,
    category: "Desserts",
    cuisine: "American",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
    available: true,
    popular: true,
    featured: false,
    preparationTime: 12,
    calories: 450,
    vegetarian: true,
    vegan: false,
    glutenFree: false,
    spicyLevel: "mild",
    ingredients: ["chocolate", "flour", "eggs", "sugar", "vanilla ice cream"],
    tags: ["dessert", "chocolate", "sweet"],
    createdAt: new Date().toISOString()
  }
]

// Sample Users Data
const sampleUsers = [
  {
    email: "student@example.com",
    password: "password123",
    name: "John Student",
    role: "student",
    phone: "+1234567890",
    defaultAddress: {
      street: "123 University Ave",
      city: "Boston",
      state: "MA",
      zipCode: "02115"
    }
  },
  {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role: "admin"
  },
  {
    email: "delivery@example.com",
    password: "password123",
    name: "Mike Delivery",
    role: "delivery",
    phone: "+1987654321",
    vehicleType: "bike"
  },
  {
    email: "jane.student@example.com",
    password: "password123",
    name: "Jane Student",
    role: "student",
    phone: "+1234567891",
    defaultAddress: {
      street: "456 College Ave",
      city: "Boston",
      state: "MA",
      zipCode: "02115"
    }
  }
]

// Restaurant Data
const restaurantData = {
  name: "Campus Food Court",
  description: "Main food court serving all your favorite dishes",
  address: {
    street: "100 Campus Drive",
    city: "Boston",
    state: "MA",
    zipCode: "02115"
  },
  phone: "+1234567890",
  email: "info@campusfoodcourt.com",
  hours: {
    monday: "10:00 AM - 10:00 PM",
    tuesday: "10:00 AM - 10:00 PM",
    wednesday: "10:00 AM - 10:00 PM",
    thursday: "10:00 AM - 10:00 PM",
    friday: "10:00 AM - 12:00 AM",
    saturday: "11:00 AM - 12:00 AM",
    sunday: "11:00 AM - 9:00 PM"
  },
  cuisine: ["American", "Italian", "Asian", "Mexican"],
  rating: 4.5,
  totalReviews: 1250,
  deliveryTime: "30-45 min",
  deliveryFee: 2.99,
  minimumOrder: 10,
  paymentMethods: ["cash", "card", "online"],
  featured: true,
  isActive: true,
  createdAt: new Date().toISOString()
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...")
  console.log("=================================")

  try {
    // 1. Seed Foods
    console.log("\n📦 Seeding foods...")
    for (const food of sampleFoods) {
      try {
        const docRef = await addDoc(collection(db, "foods"), food)
        console.log(`✅ Added: ${food.name}`)
      } catch (error) {
        console.error(`❌ Failed to add ${food.name}:`, error.message)
      }
    }

    // 2. Seed Users (with Firebase Auth)
    console.log("\n👥 Seeding users...")
    for (const userData of sampleUsers) {
      try {
        // Create in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        )
        
        // Create user document in Firestore
        const userDoc = {
          uid: userCredential.user.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone || "",
          createdAt: new Date().toISOString(),
          isActive: true
        }

        // Add address if student
        if (userData.role === "student" && userData.defaultAddress) {
          userDoc.defaultAddress = userData.defaultAddress
        }

        // Add delivery info if delivery
        if (userData.role === "delivery") {
          userDoc.vehicleType = userData.vehicleType
          userDoc.status = "active"
          userDoc.currentOrders = 0
          userDoc.totalDeliveries = 0
          userDoc.rating = 5.0
        }

        await setDoc(doc(db, "users", userCredential.user.uid), userDoc)
        console.log(`✅ Created user: ${userData.email} (${userData.role})`)
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          console.log(`⚠️ User already exists: ${userData.email}`)
        } else {
          console.error(`❌ Failed to create ${userData.email}:`, error.message)
        }
      }
    }

    // 3. Seed Restaurant
    console.log("\n🏪 Seeding restaurant...")
    try {
      await setDoc(doc(db, "restaurants", "main"), restaurantData)
      console.log("✅ Added restaurant: Campus Food Court")
    } catch (error) {
      console.error("❌ Failed to add restaurant:", error.message)
    }

    console.log("\n=================================")
    console.log("✨ Database seeding completed successfully!")
    console.log("=================================")
    console.log("\n📝 Sample Login Credentials:")
    console.log("---------------------------------")
    console.log("👨‍🎓 Student: student@example.com / password123")
    console.log("👨‍💼 Admin: admin@example.com / password123")
    console.log("🚚 Delivery: delivery@example.com / password123")
    console.log("👩‍🎓 Student 2: jane.student@example.com / password123")
    console.log("=================================")

  } catch (error) {
    console.error("\n❌ Error seeding database:", error)
  }
}

// Run the seed function
seedDatabase()