import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useRole } from '../../context/RoleContext'
import Button from '../ui/Button'
import GlassCard from '../ui/GlassCard'
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const FoodCard = ({ food, restaurant }) => {
  const { addToCart } = useCart()
  const { role } = useRole()
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!food.available) {
      toast.error('This item is currently unavailable')
      return
    }
    addToCart(food, restaurant)
  }

  const handleLike = (e) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites')
  }

  return (
    <GlassCard className="overflow-hidden group">
      <div className="relative">
        {/* Image */}
        <div className="h-48 overflow-hidden rounded-t-xl">
          <img
            src={imageError ? 'https://via.placeholder.com/400x300?text=Food+Image' : food.image}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          {isLiked ? (
            <HeartIconSolid className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Availability badge */}
        {!food.available && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Unavailable
          </div>
        )}

        {/* Popular badge */}
        {food.popular && (
          <div className="absolute bottom-2 left-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">
            🔥 Popular
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{food.name}</h3>
          <span className="text-lg font-bold text-primary-600">${food.price}</span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{food.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {food.category}
          </span>

          {role === 'student' && (
            <Button
              variant={food.available ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleAddToCart}
              disabled={!food.available}
            >
              <ShoppingCartIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {food.preparationTime && (
          <p className="text-xs text-gray-500 mt-2">
            ⏱️ Prep time: {food.preparationTime} mins
          </p>
        )}
      </div>
    </GlassCard>
  )
}

export default FoodCard