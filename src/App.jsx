import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { RoleProvider } from './context/RoleContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import NotificationListener from './components/notifications/NotificationListener'

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

// Other
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <CartProvider>
          <NotificationListener />
          <Routes>
            {/* Public Routes */}
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
            
            {/* 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </CartProvider>
      </RoleProvider>
    </AuthProvider>
  )
}

export default App