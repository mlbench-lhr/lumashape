'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';

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
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingCheckoutItems, setPendingCheckoutItems] = useState<string[]>([]);
  const DISCLAIMER_TEXT = 'By completing this order, you acknowledge that all tool lengths, cut depths, and layout dimensions were provided or confirmed by you. Lumashape generates layout files and foam inserts based solely on the information you enter. Lumashape is not responsible for incorrect sizing, scaling errors, inaccurate tool dimensions, or cut depths that result from user input. Any manufacturing issues arising from incorrect or incomplete data provided by the user are fully the user’s responsibility.';

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

  // Remove the problematic useEffect that was causing infinite calls
  // The CartContext already handles syncing when user changes
  // useEffect(() => {
  //   if (user) {
  //     syncCart();
  //   }
  // }, [user, syncCart]);

  const handleSubmitOrder = async () => {
    if (!isAuthenticated()) {
      toast.error("Please log in to checkout");
      return;
    }
    const selectedIds = cartItems.filter((item) => item.selected).map((i) => i.id);
    if (selectedIds.length === 0) {
      toast.error("Please select at least one item to checkout");
      return;
    }
    setPendingCheckoutItems(selectedIds);
    setShowDisclaimer(true);
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
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 pt-24">
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
            <div className="bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-gray-300 accent-[#2E6C99]"
                    checked={cartItems.length > 0 && cartItems.every(item => item.selected)}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  <span className="text-lg font-medium">Select All</span>
                </label>
                {loading && <div className="text-sm text-gray-500">Updating...</div>}
              </div>

              {cartItems.map(item => {
                const selectedStyles = item.selected
                  ? 'bg-blue-50 border border-[#2E6C99]'
                  : 'bg-white border border-gray-200';
                return (
                  <div key={item.id} className={`p-4 mb-2 ${selectedStyles}`}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 mr-4 rounded border-2 border-gray-300 accent-[#2E6C99]"
                        checked={item.selected}
                        onChange={(e) => toggleSelected(item.id, e.target.checked)}
                      />

                      <div className="flex flex-1 items-center">
                        {/* Layout Image */}
                        <div className="relative w-32 h-32 bg-white mr-6 rounded-md border border-gray-200">
                          {item.snapshotUrl ? (
                            <Image src={item.snapshotUrl} alt={item.name} fill className="object-contain" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image src="/images/icons/workspace/noLayouts.svg" alt="Layout" width={40} height={40} />
                            </div>
                          )}
                        </div>

                        {/* Layout Details */}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <p className="text-base text-gray-700">{`Container Size : ${item.containerSize} x ${item.layoutData?.canvas.thickness}"`}</p>
                          <p className="text-base text-gray-700">{`Foam Color : ${item.layoutData?.canvas.materialColor}`}</p>
                        </div>

                        {/* Quantity Controls as circles */}
                        <div className="flex items-center gap-4 mr-6">
                          <button
                            className="w-10 h-10 rounded-full border border-[#2E6C99] text-[#2E6C99] flex items-center justify-center disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading}
                            aria-label="Increase"
                          >
                            <Plus size={18} />
                          </button>
                          <span className="text-lg font-medium min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button
                            className="w-10 h-10 rounded-full border border-[#2E6C99] text-[#2E6C99] flex items-center justify-center disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || loading}
                            aria-label="Decrease"
                          >
                            <Minus size={18} />
                          </button>
                        </div>

                        {/* Trash button as blue circle */}
                        <button
                          className="w-10 h-10 rounded-full bg-[#EAF2FB] text-[#2E6C99] flex items-center justify-center hover:bg-[#DFEAF8] disabled:opacity-50"
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          aria-label="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Inspect Layout moved to far right */}
                    <div className="flex justify-end">
                      <Link
                        href={`/inspect-layout/${item.id}`}
                        className="text-[#2E6C99] text-base underline whitespace-nowrap"
                      >
                        Inspect Layout
                      </Link>
                    </div>
                  </div>
                );
              })}
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
              <div className="bg-blue-50 p-4 mb-6">
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
                        <p className="text-xs text-gray-600">{`Container Size : ${item.containerSize} x ${item.layoutData?.canvas.thickness}"`}</p>
                        <p className="text-xs text-gray-600">{`Foam Color : ${item.layoutData?.canvas.materialColor}`}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Price Breakdown */}
              <div className="pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
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
                {isSubmitting ? 'Redirecting...' : 'Checkout'}
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
      {showDisclaimer && (
        <Modal
          isOpen={showDisclaimer}
          title="Disclaimer"
          description={DISCLAIMER_TEXT}
          onCancel={() => { setShowDisclaimer(false); setPendingCheckoutItems([]); }}
          onConfirm={() => {
            const qs = encodeURIComponent(pendingCheckoutItems.join(','));
            window.location.href = `/checkout?items=${qs}`;
          }}
          cancelText="Cancel"
          confirmText="Proceed"
          hideImage
        />
      )}
    </div>
  );
};

export default Cart;