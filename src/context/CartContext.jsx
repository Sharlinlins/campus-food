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

  // Load cart from localStorage only once on mount
  useEffect(() => {
    isMounted.current = true
    
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          const { items, restaurant: savedRestaurant } = JSON.parse(savedCart)
          if (isMounted.current) {
            setCartItems(items || [])
            setRestaurant(savedRestaurant || null)
          }
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
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify({
        items: cartItems,
        restaurant
      }))
    }
  }, [cartItems, restaurant, isInitialized])

  const addToCart = useCallback((item, newRestaurant) => {
    if (restaurant && restaurant.id !== newRestaurant.id && cartItems.length > 0) {
      const shouldClear = window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')
      if (!shouldClear) return
      setCartItems([])
    }

    setRestaurant(newRestaurant)
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id)
      
      if (existingItem) {
        toast.success(`Updated ${item.name} quantity`)
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        toast.success(`Added ${item.name} to cart`)
        return [...prevItems, { ...item, quantity: 1 }]
      }
    })
  }, [restaurant, cartItems.length])

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === itemId)
      if (item) {
        toast.success(`Removed ${item.name} from cart`)
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
    toast.success('Cart cleared')
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