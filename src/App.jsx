import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { RoleProvider } from './context/RoleContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import NotificationListener from './components/notifications/NotificationListener'
import Notifications from './pages/notifications/Notifications'
import MobileNotificationBell from './components/notifications/MobileNotificationBell'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student Pages
import Menu from './pages/student/Menu'
import Cart from './pages/student/Cart'
import MyOrders from './pages/student/MyOrders'
import OrderTracking from './pages/student/OrderTracking'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import ManageMenu from './pages/admin/ManageMenu'
import ManageDeliveryBoys from './pages/admin/ManageDeliveryBoys'
import OrdersManagement from './pages/admin/OrdersManagement'

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import AssignedOrders from './pages/delivery/AssignedOrders'

// Profile Page
import Profile from './pages/profile/Profile'

// Other
import NotFound from './pages/NotFound'

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

// Helper to check if route is public
const isPublicRoute = (pathname) => {
  const publicRoutes = ['/login', '/register']
  return publicRoutes.includes(pathname)
}

// Main App Content with auth check
const AppContent = () => {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  // Show loading while auth state is being determined
  if (loading) {
    return <LoadingSpinner />
  }
  
  // Only show notifications on authenticated routes (not on login/register)
  const showNotifications = user && !isPublicRoute(location.pathname)
  
  return (
    <>
      {showNotifications && <NotificationListener />}
      {showNotifications && <MobileNotificationBell />}
      
      <Routes>
        {/* Public Routes - No notifications here */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Student Routes */}
        <Route path="/" element={<ProtectedRoute allowedRoles={['student']}><Menu /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute allowedRoles={['student']}><Menu /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['student']}><Cart /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['student']}><MyOrders /></ProtectedRoute>} />
        <Route path="/order-tracking/:orderId" element={<ProtectedRoute allowedRoles={['student']}><OrderTracking /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute allowedRoles={['admin']}><ManageMenu /></ProtectedRoute>} />
        <Route path="/admin/delivery-boys" element={<ProtectedRoute allowedRoles={['admin']}><ManageDeliveryBoys /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><OrdersManagement /></ProtectedRoute>} />
        
        {/* Delivery Routes */}
        <Route path="/delivery" element={<ProtectedRoute allowedRoles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="/delivery/orders" element={<ProtectedRoute allowedRoles={['delivery']}><AssignedOrders /></ProtectedRoute>} />
        
        {/* Profile Route */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        {/* 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </RoleProvider>
    </AuthProvider>
  )
}

export default App