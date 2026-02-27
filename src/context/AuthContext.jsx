import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)

  // Use useCallback for functions
  const setUserState = useCallback((newUser) => {
    if (isMounted.current) {
      setUser(newUser)
    }
  }, [])

  const setLoadingState = useCallback((value) => {
    if (isMounted.current) {
      setLoading(value)
    }
  }, [])

  const setErrorState = useCallback((value) => {
    if (isMounted.current) {
      setError(value)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUserState(user)
      setLoadingState(false)
    })
    
    return () => {
      isMounted.current = false
      unsubscribe()
    }
  }, [setUserState, setLoadingState])

  const login = useCallback(async (email, password) => {
    try {
      setErrorState(null)
      const user = await authService.login(email, password)
      setUserState(user)
      toast.success('Login successful!')
      return user
    } catch (error) {
      setErrorState(error.message)
      toast.error(error.message)
      throw error
    }
  }, [setErrorState, setUserState])

  const register = useCallback(async (userData) => {
    try {
      setErrorState(null)
      const user = await authService.register(userData)
      setUserState(user)
      toast.success('Registration successful!')
      return user
    } catch (error) {
      setErrorState(error.message)
      toast.error(error.message)
      throw error
    }
  }, [setErrorState, setUserState])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setUserState(null)
      toast.success('Logged out successfully')
    } catch (error) {
      setErrorState(error.message)
      toast.error(error.message)
    }
  }, [setErrorState, setUserState])

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}