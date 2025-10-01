'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'react-toastify';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    toggleSelected, 
    toggleSelectAll,
    totalPrice 
  } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Order submitted successfully! Stripe integration will be added later.");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Cart</h1>
      
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
          <p className="text-gray-600">Add layouts to your cart from the workspace</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mr-2"
                  checked={cartItems.every(item => item.selected)}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span className="font-medium">Select All</span>
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
                      <div className="relative w-24 h-24 bg-gray-100 mr-4">
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
                        <p className="text-sm text-gray-600">Container Size : {item.containerSize}</p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-md mr-4">
                        <button 
                          className="px-2 py-1"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button 
                          className="px-2 py-1"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="w-20 text-right font-semibold">
                        ${item.price}
                      </div>
                      
                      {/* Remove Button */}
                      <button 
                        className="ml-4 text-gray-400 hover:text-red-500"
                        onClick={() => removeFromCart(item.id)}
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
                
                {cartItems.filter(item => item.selected).map(item => (
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
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">Container Size : {item.containerSize}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Price Breakdown */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Layout Base Price</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base price per layout design</span>
                </div>
              </div>
              
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>$0</span>
                </div>
              </div>
              
              <div className="flex justify-between font-bold mb-6">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
              
              <button 
                className="w-full bg-primary text-white py-3 rounded-lg font-medium cursor-pointer"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cartItems.filter(item => item.selected).length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Submit Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;