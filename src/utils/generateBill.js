export const generateBill = (order) => {
  const TAX_RATE = 0.1 // 10% tax
  const DELIVERY_FEE = 2.99

  const subtotal = order.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  )

  const tax = subtotal * TAX_RATE
  const total = subtotal + tax + DELIVERY_FEE

  const bill = {
    orderId: order.id,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    })),
    subtotal: subtotal,
    tax: tax,
    deliveryFee: DELIVERY_FEE,
    total: total,
    generatedAt: new Date().toISOString(),
    paymentMethod: order.paymentMethod || 'pending',
    paymentStatus: 'pending'
  }

  return bill
}