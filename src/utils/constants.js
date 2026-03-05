export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  DELIVERY: 'delivery'
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-pink-100 text-pink-800',
  on_the_way: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

// Define the flow of order statuses
export const ORDER_STATUS_FLOW = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'assigned',
  assigned: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered'
}

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online'
}

export const FOOD_CATEGORIES = [
  'Burgers',
  'Pizza',
  'Sushi',
  'Chinese',
  'Indian',
  'Italian',
  'Mexican',
  'Desserts',
  'Beverages',
  'Salads',
  'Breakfast',
  'Lunch Specials',
  'Seafood',
  'Vegetarian',
  'Vegan',
  'Gluten-Free'
]

export const DELIVERY_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline'
}

export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_READY: 'order_ready',
  ORDER_ASSIGNED: 'order_assigned',
  ORDER_PICKED_UP: 'order_picked_up',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  DELIVERY_LOCATION: 'delivery_location',
  PROMOTION: 'promotion'
}
