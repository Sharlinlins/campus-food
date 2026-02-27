import React, { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { authService } from '../services/authService'

const RoleContext = createContext()

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

export const RoleProvider = ({ children }) => {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          setLoading(true)
          const userRole = await authService.getUserRole(user.uid)
          setRole(userRole)
          
          // Set permissions based on role
          const rolePermissions = getPermissionsForRole(userRole)
          setPermissions(rolePermissions)
        } catch (error) {
          console.error('Error fetching user role:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setRole(null)
        setPermissions([])
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  const getPermissionsForRole = (role) => {
    const permissionsMap = {
      student: [
        'view_menu',
        'place_order',
        'track_order',
        'view_orders',
        'rate_food'
      ],
      admin: [
        'manage_users',
        'manage_menu',
        'manage_orders',
        'manage_delivery',
        'view_analytics',
        'manage_roles',
        'send_notifications'
      ],
      delivery: [
        'view_assigned_orders',
        'update_order_status',
        'view_delivery_stats'
      ]
    }

    return permissionsMap[role] || []
  }

  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }

  const hasRole = (allowedRoles) => {
    if (!role) return false
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role)
    }
    return role === allowedRoles
  }

  const value = {
    role,
    permissions,
    loading,
    hasPermission,
    hasRole
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}