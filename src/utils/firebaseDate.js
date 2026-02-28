import { Timestamp } from 'firebase/firestore'

// Convert various date formats to a consistent Date object
export const toDate = (dateValue) => {
  if (!dateValue) return null
  
  try {
    // Handle Firebase Timestamp
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate()
    }
    
    // Handle object with toDate method (Firestore Timestamp)
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate()
    }
    
    // Handle Firestore Timestamp object with seconds
    if (dateValue && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000)
    }
    
    // Handle Date object
    if (dateValue instanceof Date) {
      return dateValue
    }
    
    // Handle string or number
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? null : date
    }
    
    return null
  } catch (error) {
    console.error('Error converting to date:', error, dateValue)
    return null
  }
}

// Safe date formatter with fallback
export const safeFormatDate = (dateValue, format = 'medium', fallback = 'N/A') => {
  const date = toDate(dateValue)
  if (!date) return fallback
  
  // Use your existing formatDate function
  return formatDate(date, format)
}