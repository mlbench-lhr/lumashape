'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'react-toastify';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    toggleSelected, 
    toggleSelectAll,
    totalPrice,
    loading,
    syncCart
  } = useCart();
  
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Check if user is authenticated (either user object exists or token exists)
  const isAuthenticated = () => {
    if (user) return true;
    
    // Check if token exists in localStorage as fallback
    try {
      const token = localStorage.getItem("auth-token");
      return !!token;
    } catch {
      return false;
    }
  };

  // Handle user loading state
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("auth-token");
      if (token && !user) {
        // Token exists but user not loaded yet, keep loading
        setIsUserLoading(true);
      } else {
        // Either user is loaded or no token exists
        setIsUserLoading(false);
      }
    };

    checkAuthStatus();
    
    // Set a timeout to stop loading after a reasonable time
    const timeout = setTimeout(() => {
      setIsUserLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [user]);

  // Ensure cart is synced when component mounts or user changes
  useEffect(() => {
    if (user) {
      syncCart();
    }
  }, [user, syncCart]);

  const handleSubmitOrder = () => {
    if (!isAuthenticated()) {
      toast.error("Please log in to submit an order");
      return;
    }

    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to submit an order");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Order submitted successfully! Stripe integration will be added later.");
      setIsSubmitting(false);
    }, 1500);
  };

  // Show loading state while checking authentication or loading cart
  if (isUserLoading || (loading && cartItems.length === 0 && isAuthenticated())) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Cart</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Cart</h1>
        <div className="text-center py-12">
          <div className="mb-4">
            <Image 
              src="/images/icons/workspace/noLayouts.svg" 
              alt="Login Required" 
              width={120} 
              height={120} 
              className="mx-auto"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2">Please log in to view your cart</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access your cart items</p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Cart</h1>
        {user && (
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{user.email}</span>
          </p>
        )}
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Image 
              src="/images/icons/workspace/noLayouts.svg" 
              alt="Empty Cart" 
              width={120} 
              height={120} 
              className="mx-auto"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add layouts to your cart from the workspace</p>
          <button 
            onClick={() => window.location.href = '/workspace'}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Go to Workspace
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 mr-2"
                    checked={cartItems.length > 0 && cartItems.every(item => item.selected)}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  <span className="font-medium">Select All ({cartItems.length} items)</span>
                </div>
                {loading && (
                  <div className="text-sm text-gray-500">Updating...</div>
                )}
              </div>
              
              {cartItems.map(item => (
                <div key={item.id} className="border-t py-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 mr-4"
                      checked={item.selected}
                      onChange={(e) => toggleSelected(item.id, e.target.checked)}
                    />
                    
                    <div className="flex flex-1 items-center">
                      {/* Layout Image */}
                      <div className="relative w-24 h-24 bg-gray-100 mr-4 rounded-lg overflow-hidden">
                        {item.snapshotUrl ? (
                          <Image 
                            src={item.snapshotUrl} 
                            alt={item.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image 
                              src="/images/icons/workspace/noLayouts.svg" 
                              alt="Layout" 
                              width={40} 
                              height={40} 
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Layout Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">Container Size: {item.containerSize}</p>
                        {item.brand && (
                          <p className="text-sm text-gray-500">Brand: {item.brand}</p>
                        )}
                        {item.layoutData && (
                          <p className="text-xs text-gray-400">
                            Tools: {item.layoutData.tools.length} | 
                            Canvas: {item.layoutData.canvas.width}×{item.layoutData.canvas.height} {item.layoutData.canvas.unit}
                          </p>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-md mr-4">
                        <button 
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || loading}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-3 min-w-[2rem] text-center">{item.quantity}</span>
                        <button 
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="w-20 text-right font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      
                      {/* Remove Button */}
                      <button 
                        className="ml-4 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        onClick={() => removeFromCart(item.id)}
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 ml-9">
                    <button 
                      className="text-primary text-sm hover:underline"
                      onClick={() => window.open(`/inspect-layout/${item.id}`, '_blank')}
                    >
                      Inspect Layout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              
              <p className="text-sm text-gray-600 mb-6">
                Review your layout details, shipping info, and pricing before finalizing your order.
              </p>
              
              {/* Selected Layout Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Layout Details</h3>
                
                {cartItems.filter(item => item.selected).length === 0 ? (
                  <p className="text-sm text-gray-600">No items selected</p>
                ) : (
                  cartItems.filter(item => item.selected).map(item => (
                    <div key={item.id} className="flex items-center mb-2">
                      <div className="relative w-12 h-12 bg-white rounded mr-3">
                        {item.snapshotUrl ? (
                          <Image 
                            src={item.snapshotUrl} 
                            alt={item.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image 
                              src="/images/icons/workspace/noLayouts.svg" 
                              alt="Layout" 
                              width={20} 
                              height={20} 
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">Container Size: {item.containerSize}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Price Breakdown */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Layout Base Price</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base price per layout design</span>
                </div>
              </div>
              
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>$0.00</span>
                </div>
              </div>
              
              <div className="flex justify-between font-bold mb-6">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              
              <button 
                className="w-full bg-primary text-white py-3 rounded-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || loading || cartItems.filter(item => item.selected).length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Submit Order'}
              </button>
              
              {cartItems.filter(item => item.selected).length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Select items to submit an order
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;