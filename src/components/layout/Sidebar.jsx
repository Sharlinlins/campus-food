import React from 'react'
import { NavLink } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { 
  HomeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClipboardListIcon,
  TruckIcon,
  CogIcon,
  LogoutIcon
} from '@heroicons/react/outline'
import { motion } from 'framer-motion'

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useRole()

  const studentLinks = [
    { name: 'Menu', path: '/menu', icon: ShoppingBagIcon },
    { name: 'My Orders', path: '/my-orders', icon: ClipboardListIcon },
    { name: 'Cart', path: '/cart', icon: ShoppingBagIcon },
  ]

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: HomeIcon },
    { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Manage Menu', path: '/admin/menu', icon: ShoppingBagIcon },
    { name: 'Manage Orders', path: '/admin/orders', icon: ClipboardListIcon },
    { name: 'Delivery Boys', path: '/admin/delivery-boys', icon: TruckIcon },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Settings', path: '/admin/settings', icon: CogIcon },
  ]

  const deliveryLinks = [
    { name: 'Dashboard', path: '/delivery', icon: HomeIcon },
    { name: 'Assigned Orders', path: '/delivery/orders', icon: ClipboardListIcon },
    { name: 'Delivery History', path: '/delivery/history', icon: TruckIcon },
  ]

  const getLinks = () => {
    switch(role) {
      case 'admin':
        return adminLinks
      case 'delivery':
        return deliveryLinks
      default:
        return studentLinks
    }
  }

  const links = getLinks()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`
          fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-md 
          shadow-2xl z-50 lg:translate-x-0 lg:static lg:h-screen
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-300 ease-in-out lg:transition-none
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">CF</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">CampusFood</h2>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-300 group
                    ${isActive 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }
                  `}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="font-medium">{link.name}</span>
                  
                  {/* Active Indicator */}
                  {({ isActive }) => isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 w-1 h-8 bg-white rounded-l-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Handle logout
              onClose()
            }}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogoutIcon className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar