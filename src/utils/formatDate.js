// Date formatting function with robust error handling
export const formatDate = (date, format = 'medium') => {
  // Handle null, undefined, or empty values
  if (date === undefined || date === null || date === '') {
    console.warn('formatDate received invalid date:', date)
    return 'N/A'
  }

  try {
    // Handle Firebase Timestamp objects
    let dateObj
    if (date && typeof date.toDate === 'function') {
      // It's a Firebase Timestamp
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      // It's already a Date object
      dateObj = date
    } else if (typeof date === 'string' || typeof date === 'number') {
      // It's a string or timestamp number
      dateObj = new Date(date)
    } else if (date.seconds) {
      // It's a Firebase Timestamp in object form
      dateObj = new Date(date.seconds * 1000)
    } else {
      console.warn('formatDate received unknown date format:', date)
      return 'Invalid Date'
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('formatDate received invalid date value:', date)
      return 'Invalid Date'
    }

    const formats = {
      short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      },
      medium: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      long: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit'
      },
      date: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      },
      relative: (date) => {
        const now = new Date()
        const diff = now - dateObj
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 7) return formatDate(date, 'medium')
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        if (seconds > 30) return `${seconds} seconds ago`
        return 'Just now'
      }
    }

    if (format === 'relative') {
      return formats.relative(dateObj)
    }

    return dateObj.toLocaleDateString('en-US', formats[format] || formats.medium)
    
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date)
    return 'Invalid Date'
  }
}

// Currency formatting function for Indian Rupees
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Optional: For displaying without decimals (for whole numbers)
export const formatCurrencySimple = (amount) => {
  if (amount === undefined || amount === null) return '₹0'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Alternative: If you want to handle lakhs/crores formatting
export const formatIndianCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0'
  
  // For large amounts, format in lakhs/crores
  if (amount >= 10000000) { // 1 Crore+
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) { // 1 Lakh+
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  
  // Use standard Indian number formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Number formatting function (for non-currency numbers)
export const formatNumber = (number, decimals = 0) => {
  if (number === undefined || number === null) return '0'
  
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

// Percentage formatting function
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0%'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

// Phone number formatting
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return ''
  
  const cleaned = ('' + phoneNumber).replace(/\D/g, '')
  
  // Check if it's an Indian number with +91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+91 ' + cleaned.slice(2, 7) + ' ' + cleaned.slice(7)
  }
  
  // 10-digit Indian number
  if (cleaned.length === 10) {
    return '+91 ' + cleaned.slice(0, 5) + ' ' + cleaned.slice(5)
  }
  
  return phoneNumber
}

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}