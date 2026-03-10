import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import { orderService } from "../../services/orderService";
import { ORDER_STATUS, ORDER_STATUS_LABELS } from "../../utils/constants";
import { formatDate, formatCurrency } from "../../utils/formatDate";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchOrder();

    // 🔄 Set up real-time listener for order updates
    const unsubscribe = orderService.subscribeToOrders(
      (orders) => {
        const updatedOrder = orders.find((o) => o.id === orderId);
        if (updatedOrder) {
          console.log("Order updated in real-time:", updatedOrder.status);
          setOrder(updatedOrder);

          // Show toast notification for status change
          if (order && order.status !== updatedOrder.status) {
            toast.success(`Order ${ORDER_STATUS_LABELS[updatedOrder.status]}`);
          }
        }
      },
      { orderId },
    );

    return () => unsubscribe();
  }, [orderId, order?.status]);

  const fetchOrder = async () => {
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Calculate current step
      if (orderData) {
        const step = getStatusStep(orderData.status);
        setCurrentStep(step);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.ASSIGNED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.ON_THE_WAY,
      ORDER_STATUS.DELIVERED,
    ];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.DELIVERED:
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case ORDER_STATUS.CANCELLED:
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      case ORDER_STATUS.ON_THE_WAY:
        return <TruckIcon className="h-8 w-8 text-blue-500 animate-pulse" />;
      default:
        return <ClockIcon className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      [ORDER_STATUS.PENDING]:
        "Your order has been placed and is waiting for confirmation",
      [ORDER_STATUS.CONFIRMED]: "Restaurant has confirmed your order",
      [ORDER_STATUS.PREPARING]: "Your food is being prepared",
      [ORDER_STATUS.READY]: "Your order is ready for pickup",
      [ORDER_STATUS.ASSIGNED]: "A delivery partner has been assigned",
      [ORDER_STATUS.PICKED_UP]: "Delivery partner has picked up your order",
      [ORDER_STATUS.ON_THE_WAY]: "Your order is on the way!",
      [ORDER_STATUS.DELIVERED]: "Order delivered! Enjoy your meal!",
      [ORDER_STATUS.CANCELLED]: "Order has been cancelled",
    };
    return messages[status] || "Processing your order";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container-custom py-8">
          <GlassCard className="text-center py-12">
            <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Order not found</p>
            <Button onClick={() => navigate("/my-orders")} className="mt-4">
              Back to Orders
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const totalSteps = 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <div className="container-custom py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tracking info */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Order #{order.orderNumber || order.id.slice(-8)}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(order.createdAt, "long")}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === ORDER_STATUS.DELIVERED
                        ? "bg-green-100 text-green-800"
                        : order.status === ORDER_STATUS.CANCELLED
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-primary-700">
                  {getStatusMessage(order.status)}
                </p>
              </div>

              {/* Progress tracker */}
              {!isCancelled && (
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    {[
                      "Pending",
                      "Confirmed",
                      "Preparing",
                      "Ready",
                      "Assigned",
                      "Picked",
                      "On Way",
                      "Delivered",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className={`text-xs font-medium ${
                          index <= currentStep
                            ? "text-primary-600"
                            : "text-gray-400"
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <motion.div
                      className="absolute h-2 bg-primary-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(currentStep / (totalSteps - 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                    <div className="absolute -top-1 left-0 right-0 flex justify-between">
                      {[...Array(totalSteps)].map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`w-4 h-4 rounded-full border-2 border-white ${
                            index <= currentStep
                              ? "bg-primary-600 ring-2 ring-primary-200"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Order details */}
              <div className="border-t pt-6">
                <h2 className="font-semibold text-lg mb-4">Order Details</h2>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="border-t mt-4 pt-4">
                  <h3 className="font-semibold mb-3">Status History</h3>
                  <div className="space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div
                          className={`w-2 h-2 mt-2 rounded-full ${
                            history.status === ORDER_STATUS.DELIVERED
                              ? "bg-green-500"
                              : history.status === ORDER_STATUS.CANCELLED
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {ORDER_STATUS_LABELS[history.status]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(history.timestamp, "medium")}
                            {history.note && ` - ${history.note}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Delivery info */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h2 className="font-semibold text-lg mb-4">
                Delivery Information
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="font-medium">
                    {order.deliveryAddress || "N/A"}
                  </p>
                </div>

                {order.userPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{order.userPhone}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">
                    {order.paymentMethod || "N/A"}
                  </p>
                </div>
                {order.deliveryBoyName && (
                  <div>
                    <p className="text-sm text-gray-500">Delivery Partner</p>
                    <p className="font-medium">{order.deliveryBoyName}</p>
                  </div>
                )}
                {order.specialInstructions && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Special Instructions
                    </p>
                    <p className="text-sm italic">
                      {order.specialInstructions}
                    </p>
                  </div>
                )}
                {/* Estimated delivery time */}
                {!isCancelled && order.status !== ORDER_STATUS.DELIVERED && (
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-primary-700 font-medium">
                      Estimated Delivery
                    </p>
                    <p className="text-lg font-bold text-primary-800">
                      {order.estimatedDeliveryTime || "30-45 minutes"}
                    </p>
                  </div>
                )}
                {order.status === ORDER_STATUS.DELIVERED &&
                  order.deliveredAt && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">
                        Delivered At
                      </p>
                      <p className="text-lg font-bold text-green-800">
                        {formatDate(order.deliveredAt, "time")}
                      </p>
                    </div>
                  )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
