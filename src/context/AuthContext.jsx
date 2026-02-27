import React, { createContext, useState, useContext, useEffect } from 'react'
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

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const user = await authService.login(email, password)
      setUser(user)
      toast.success('Login successful!')
      return user
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const user = await authService.register(userData)
      setUser(user)
      toast.success('Registration successful!')
      return user
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
    }
  }

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