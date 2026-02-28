import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import CartItem from "../../components/food/CartItem";
import { orderService } from "../../services/orderService";
import {
  TrashIcon,
  CreditCardIcon,
  BanknotesIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { formatCurrency } from '../../utils/formatDate'
import toast from "react-hot-toast";

const Cart = () => {
  const { cartItems, restaurant, clearCart, getCartTotal, isInitialized } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1;
  const deliveryFee = 2.99;
  const total = subtotal + tax + deliveryFee;

  // Get user's location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation
        .getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            toast.success("Location captured successfully");

            // Reverse geocode to get address (optional)
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.display_name) {
                  setDeliveryAddress(data.display_name);
                }
              })
              .catch((err) => console.error("Reverse geocoding failed:", err));
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error(
              "Failed to get location. Please enter address manually.",
            );
          },
        )
        .finally(() => setIsGettingLocation(false));
    } else {
      toast.error("Geolocation not supported by your browser");
      setIsGettingLocation(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate inputs
    if (!deliveryAddress.trim()) {
      setError("Please enter delivery address");
      toast.error("Please enter delivery address");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter phone number");
      toast.error("Please enter phone number for delivery updates");
      return;
    }

    if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number");
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Starting order placement...");

      const orderData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        userPhone: phoneNumber,
        restaurantId: restaurant?.id || "main",
        restaurantName: restaurant?.name || "Campus Food Court",
        items: cartItems.map((item) => ({
          foodId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        tax,
        deliveryFee,
        total,
        paymentMethod,
        deliveryAddress,
        deliveryLocation: location, // Store location if available
        specialInstructions: specialInstructions.trim() || null,
        status: "pending",
      };

      console.log("Order data prepared:", orderData);

      const order = await orderService.createOrder(orderData);
      console.log("Order created successfully:", order);

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order-tracking/${order.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error.message || "Failed to place order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-16">
          <GlassCard className="text-center p-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some delicious items to your cart
            </p>
            <Button onClick={() => navigate("/menu")} variant="primary">
              Browse Menu
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {restaurant?.name || "Campus Food Court"}
                </h2>
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear Cart
                </button>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your delivery address"
                  required
                />
              </div>
              {/* Phone Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter 10-digit mobile number"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter delivery address"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <MapPinIcon className="h-5 w-5" />
                    {isGettingLocation ? "Getting..." : "Use My Location"}
                  </button>
                </div>
                {location && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Location captured: {location.lat.toFixed(4)},{" "}
                    {location.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                      paymentMethod === "card"
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                      paymentMethod === "cash"
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <BanknotesIcon className="h-5 w-5" />
                    Cash
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any special requests?"
                />
              </div>

              <Button
                onClick={handlePlaceOrder}
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || !deliveryAddress.trim()}
              >
                Place Order
              </Button>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
