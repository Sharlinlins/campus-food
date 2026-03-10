import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const isMounted = useRef(true)
  const lastActionRef = useRef({ id: null, time: 0 })

  // Load cart from localStorage only once on mount
  useEffect(() => {
    isMounted.current = true
    
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart')
        if (savedCart && isMounted.current) {
          const { items, restaurant: savedRestaurant } = JSON.parse(savedCart)
          setCartItems(items || [])
          setRestaurant(savedRestaurant || null)
        }
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        if (isMounted.current) {
          setIsInitialized(true)
        }
      }
    }

    loadCart()

    return () => {
      isMounted.current = false
    }
  }, [])

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (isInitialized && isMounted.current) {
      localStorage.setItem('cart', JSON.stringify({
        items: cartItems,
        restaurant
      }))
    }
  }, [cartItems, restaurant, isInitialized])

  const addToCart = useCallback((item, newRestaurant) => {
    // Prevent duplicate toasts by checking if this item was just added
    const now = Date.now()
    if (lastActionRef.current.id === item.id && now - lastActionRef.current.time < 1000) {
      console.log('Duplicate add prevented')
      return // Skip if same item added within 1 second
    }

    if (restaurant && restaurant.id !== newRestaurant.id && cartItems.length > 0) {
      const shouldClear = window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')
      if (!shouldClear) return
      setCartItems([])
    }

    setRestaurant(newRestaurant)
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id)
      
      if (existingItem) {
        // Update last action ref
        lastActionRef.current = { id: item.id, time: now }
        
        // Only show toast if not a duplicate
        toast.success(`Updated ${item.name} quantity`, {
          id: `update-${item.id}-${now}`, // Unique ID to prevent duplicates
          duration: 2000
        })
        
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        // Update last action ref
        lastActionRef.current = { id: item.id, time: now }
        
        // Only show toast if not a duplicate
        toast.success(`Added ${item.name} to cart`, {
          id: `add-${item.id}-${now}`, // Unique ID to prevent duplicates
          duration: 2000
        })
        
        return [...prevItems, { ...item, quantity: 1 }]
      }
    })
  }, [restaurant, cartItems.length])

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === itemId)
      if (item) {
        toast.success(`Removed ${item.name} from cart`, {
          id: `remove-${itemId}-${Date.now()}`,
          duration: 2000
        })
      }
      return prevItems.filter(i => i.id !== itemId)
    })
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId)
      return
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCartItems([])
    setRestaurant(null)
    toast.success('Cart cleared', {
      id: 'clear-cart',
      duration: 2000
    })
  }, [])

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cartItems])

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }, [cartItems])

  const value = {
    cartItems,
    restaurant,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isInitialized
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}