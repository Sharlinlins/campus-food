import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="text-center p-8">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-8xl mb-4"
          >
            🍔
          </motion.div>
          
          <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          
          <p className="text-gray-600 mb-6">
            Oops! The page you're looking for doesn't exist or has been moved.
            Maybe you're hungry and mistyped the URL?
          </p>

          <div className="space-y-3">
            <Link to="/">
              <Button variant="primary" fullWidth>
                <HomeIcon className="h-5 w-5 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              fullWidth
              onClick={() => window.location.reload()}
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh Page
            </Button>
          </div>

          {/* Fun facts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">
              Did you know? The average person spends about 
              <span className="font-semibold text-primary-600"> 15 minutes </span> 
              deciding what to eat!
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default NotFound