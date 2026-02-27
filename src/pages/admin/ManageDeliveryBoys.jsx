import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { db } from '../../services/firebase'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ManageDeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    busy: 0,
    offline: 0
  })

  useEffect(() => {
    fetchDeliveryBoys()
  }, [])

  const fetchDeliveryBoys = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'delivery')
      )
      const querySnapshot = await getDocs(q)
      const boys = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDeliveryBoys(boys)
      
      // Calculate stats
      const active = boys.filter(b => b.status === 'active').length
      const busy = boys.filter(b => b.status === 'busy').length
      const offline = boys.filter(b => b.status === 'offline').length
      
      setStats({
        total: boys.length,
        active,
        busy,
        offline
      })
    } catch (error) {
      console.error('Error fetching delivery boys:', error)
      toast.error('Failed to fetch delivery personnel')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (deliveryBoyId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await updateDoc(doc(db, 'users', deliveryBoyId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      toast.success(`Delivery boy ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchDeliveryBoys()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Delivery Personnel</h1>
        <p className="text-gray-600 mb-8">View and manage delivery staff</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center">
            <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
            <p className="text-gray-600">Total Delivery Boys</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            <p className="text-gray-600">Active</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.busy}</p>
            <p className="text-gray-600">Busy</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-3xl font-bold text-gray-600">{stats.offline}</p>
            <p className="text-gray-600">Offline</p>
          </GlassCard>
        </div>

        {/* Delivery Boys List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {deliveryBoys.map((boy, index) => (
              <motion.div
                key={boy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{boy.name}</h3>
                      <p className="text-sm text-gray-600">{boy.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          boy.status === 'active' ? 'bg-green-100 text-green-700' :
                          boy.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {boy.status || 'inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Current Orders: {boy.currentOrders || 0}/3
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant={boy.status === 'active' ? 'success' : 'secondary'}
                      size="sm"
                      onClick={() => toggleStatus(boy.id, boy.status)}
                    >
                      {boy.status === 'active' ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Inactive
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Total Deliveries</p>
                    <p className="font-semibold">{boy.totalDeliveries || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-semibold">{boy.rating || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-semibold">
                      {boy.createdAt ? new Date(boy.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {deliveryBoys.length === 0 && (
              <GlassCard className="text-center py-12">
                <p className="text-gray-500">No delivery personnel found</p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageDeliveryBoys