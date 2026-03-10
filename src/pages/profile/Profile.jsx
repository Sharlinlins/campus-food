import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRole } from '../../context/RoleContext'
import Navbar from '../../components/layout/Navbar'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import { db } from '../../services/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  TruckIcon, 
  StarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useAuth()
  const { role } = useRole()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    address: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          vehicleType: data.vehicleType || '',
          address: data.address || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        address: formData.address,
        updatedAt: new Date().toISOString()
      })

      // Update Firebase Auth displayName
      if (formData.name !== user.displayName) {
        await updateProfile(user, {
          displayName: formData.name
        })
      }

      setEditing(false)
      fetchProfile() // Refresh profile
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      vehicleType: profile?.vehicleType || '',
      address: profile?.address || ''
    })
    setEditing(false)
  }

  const getRoleIcon = () => {
    switch(role) {
      case 'delivery':
        return <TruckIcon className="h-6 w-6 text-orange-500" />
      case 'admin':
        return <StarIcon className="h-6 w-6 text-yellow-500" />
      default:
        return <UserIcon className="h-6 w-6 text-blue-500" />
    }
  }

  const getRoleBadge = () => {
    const badges = {
      student: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
      delivery: 'bg-orange-100 text-orange-800'
    }
    return badges[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Profile Header */}
          <GlassCard className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-600">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {profile?.name || 'User'}
                  </h1>
                  {getRoleIcon()}
                </div>
                <p className="text-gray-600">{user?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge()}`}>
                  {role?.charAt(0).toUpperCase() + role?.slice(1)}
                </span>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Profile Details */}
          <GlassCard>
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            
            {editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+91 12345 67890"
                  />
                </div>

                {role === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select vehicle</option>
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                      <option value="walking">Walking</option>
                    </select>
                  </div>
                )}

                {(role === 'student' || role === 'delivery') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your address"
                    />
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-center py-2 border-b">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{profile?.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center py-2 border-b">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center py-2 border-b">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{profile?.phone || 'Not set'}</p>
                  </div>
                </div>

                {role === 'delivery' && (
                  <div className="flex items-center py-2 border-b">
                    <TruckIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-medium capitalize">{profile?.vehicleType || 'Not set'}</p>
                    </div>
                  </div>
                )}

                {(role === 'student' || role === 'delivery') && (
                  <div className="flex items-start py-2 border-b">
                    <div className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{profile?.address || 'Not set'}</p>
                    </div>
                  </div>
                )}

                {/* Stats for Delivery Boy */}
                {role === 'delivery' && profile && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold mb-3">Delivery Stats</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary-600">
                          {profile.totalDeliveries || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Deliveries</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {profile.rating || '5.0'}
                        </p>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {profile.cyclesCompleted || 0}
                        </p>
                        <p className="text-xs text-gray-500">Cycles Completed</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats for Student */}
                {role === 'student' && profile && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold mb-3">Account Stats</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary-600">
                          {profile.totalOrders || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Orders</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'New'}
                        </p>
                        <p className="text-xs text-gray-500">Member Since</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile