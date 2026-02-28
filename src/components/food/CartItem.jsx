import React from 'react'
import { useCart } from '../../context/CartContext'
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '../../utils/formatDate'
import { motion } from 'framer-motion'

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center space-x-4 py-4 border-b last:border-0"
    >
      {/* Item Image */}
      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={item.image || 'https://via.placeholder.com/100'}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{item.name}</h4>
        <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <MinusIcon className="h-4 w-4 text-gray-600" />
        </button>
        
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <PlusIcon className="h-4 w-4 text-gray-600" />
        </button>

        <button
          onClick={() => removeFromCart(item.id)}
          className="p-1 rounded-full hover:bg-red-50 transition-colors ml-2"
        >
          <TrashIcon className="h-4 w-4 text-red-500" />
        </button>
      </div>

      {/* Item Total */}
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-primary-600">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </motion.div>
  )
}

export default CartItem