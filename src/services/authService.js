import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export const authService = {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      return {
        ...user,
        role: userData?.role || 'student',
        ...userData
      }
    } catch (error) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        email: email
      })

      // Map Firebase error codes to user-friendly messages
      const errorMessages = {
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'Incorrect email or password', // Changed from specific message
        'auth/wrong-password': 'Incorrect email or password', // Changed to same message
        'auth/invalid-credential': 'Incorrect email or password', // Added for security
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
      }

      // Throw generic error for security (don't reveal if email exists)
      throw new Error(errorMessages[error.code] || 'Incorrect email or password')
    }
  },

  async register(userData) {
    try {
      const { email, password, name, role = 'student' } = userData

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName: name })

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
        isActive: true
      })

      return {
        ...user,
        role,
        name
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  },

  async logout() {
    try {
      await signOut(auth)
    } catch (error) {
      throw new Error('Failed to logout')
    }
  },

  async getUserRole(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        return userDoc.data().role
      }
      return null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  },

  async updateUserRole(userId, newRole) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      })
      return true
    } catch (error) {
      throw new Error('Failed to update user role')
    }
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  },

  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()
        callback({
          ...user,
          role: userData?.role,
          ...userData
        })
      } else {
        callback(null)
      }
    })
  },

  getErrorMessage(errorCode) {
    const errors = {
      'auth/user-not-found': 'No user found with this email',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/network-request-failed': 'Network error. Please check your connection'
    }
    return errors[errorCode] || 'An error occurred. Please try again'
  }
}