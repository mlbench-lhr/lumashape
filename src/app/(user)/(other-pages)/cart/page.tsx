"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    toggleSelected,
    toggleSelectAll,
    totalPrice,
    pricing,
    loading,
    syncCart,
  } = useCart();

  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingCheckoutItems, setPendingCheckoutItems] = useState<string[]>(
    [],
  );
  const DISCLAIMER_TEXT =
    "By completing this order, you acknowledge that all tool lengths, cut depths, and layout dimensions were provided or confirmed by you. Lumashape generates layout files and foam inserts based solely on the information you enter. Lumashape is not responsible for incorrect sizing, scaling errors, inaccurate tool dimensions, or cut depths that result from user input. Any manufacturing issues arising from incorrect or incomplete data provided by the user are fully the user’s responsibility.";

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

  const formatCanvasValue = (value: number, unit: "mm" | "inches") => {
    return unit === "mm" ? `${value}mm` : `${value}"`;
  };

  const formatThicknessValue = (value: number, unit: "mm" | "inches") => {
    return unit === "mm" ? `${value}mm` : `${value}"`;
  };

  const getContainerSizeLabel = (item: CartItem) => {
    const canvas = item.layoutData?.canvas;
    if (canvas) {
      const width = formatCanvasValue(canvas.width, canvas.unit);
      const height = formatCanvasValue(canvas.height, canvas.unit);
      const thickness = formatThicknessValue(canvas.thickness, canvas.unit);
      return `${width} x ${height} x ${thickness}`;
    }

    return item.containerSize.replaceAll("×", "x");
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated()) {
      toast.error("Please log in to checkout");
      return;
    }
    const selectedIds = cartItems
      .filter((item) => item.selected)
      .map((i) => i.id);
    if (selectedIds.length === 0) {
      toast.error("Please select at least one item to checkout");
      return;
    }
    setPendingCheckoutItems(selectedIds);
    setShowDisclaimer(true);
  };

  // Show loading state while checking authentication or loading cart
  if (
    isUserLoading ||
    (loading && cartItems.length === 0 && isAuthenticated())
  ) {
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
          <h2 className="text-xl font-semibold mb-2">
            Please log in to view your cart
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access your cart items
          </p>
          <button
            onClick={() => (window.location.href = "/auth/login")}
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
          <p className="text-gray-600 mb-4">
            Add layouts to your cart from the workspace
          </p>
          <button
            onClick={() => (window.location.href = "/workspace")}
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
                    checked={
                      cartItems.length > 0 &&
                      cartItems.every((item) => item.selected)
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  <span className="text-lg font-medium">Select All</span>
                </label>
                {loading && (
                  <div className="text-sm text-gray-500">Updating...</div>
                )}
              </div>

              {cartItems.map((item) => {
                const selectedStyles = item.selected
                  ? "bg-blue-50 border border-[#2E6C99]"
                  : "bg-white border border-gray-200";
                return (
                  <div key={item.id} className={`p-4 mb-2 ${selectedStyles}`}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 mr-4 rounded border-2 border-gray-300 accent-[#2E6C99]"
                        checked={item.selected}
                        onChange={(e) =>
                          toggleSelected(item.id, e.target.checked)
                        }
                      />

                      <div className="flex flex-1 items-center">
                        {/* Layout Image */}
                        <div className="relative w-32 h-32 bg-white mr-6 rounded-md border border-gray-200">
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
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <p className="text-base text-gray-700">{`Container Size : ${getContainerSizeLabel(item)}`}</p>
                          <p className="text-base text-gray-700">{`Foam Color : ${item.layoutData?.canvas.materialColor}`}</p>
                        </div>

                        {/* Quantity Controls as circles */}
                        <div className="flex items-center gap-4 mr-6">
                          <button
                            className="w-10 h-10 rounded-full border border-[#2E6C99] text-[#2E6C99] flex items-center justify-center disabled:opacity-50"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={loading}
                            aria-label="Increase"
                          >
                            <Plus size={18} />
                          </button>
                          <span className="text-lg font-medium min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="w-10 h-10 rounded-full border border-[#2E6C99] text-[#2E6C99] flex items-center justify-center disabled:opacity-50"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
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
                    <div className="hidden sm:flex justify-end">
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
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-4">
              {/* Header Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Order Summary
                </h2>
                <p className="text-sm text-gray-600">
                  Review your layout details, shipping info, and pricing before
                  finalizing your order.
                </p>
              </div>

              <div className="p-6">
                {/* Discount Tiers Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-gray-900 text-sm">
                      Volume Discounts
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <div className="flex justify-between items-center">
                      <span>2-4 Line Items</span>
                      <span className="font-semibold text-green-700">
                        5% OFF
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>5-9 Line Items</span>
                      <span className="font-semibold text-green-700">
                        10% OFF
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>10+ Line Items</span>
                      <span className="font-semibold text-green-700">
                        15% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Layout Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Layout Details
                  </h3>

                  {cartItems.filter((item) => item.selected).length === 0 ? (
                    <div className="text-center py-6">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">No items selected</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cartItems
                        .filter((item) => item.selected)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="relative w-14 h-14 bg-gray-50 rounded-md flex-shrink-0 border border-gray-200">
                              {item.snapshotUrl ? (
                                <Image
                                  src={item.snapshotUrl}
                                  alt={item.name}
                                  fill
                                  className="object-contain rounded-md"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Image
                                    src="/images/icons/workspace/noLayouts.svg"
                                    alt="Layout"
                                    width={24}
                                    height={24}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {item.name}
                              </p>
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <span className="font-medium">Size:</span>
                                  <span>{getContainerSizeLabel(item)}</span>
                                </p>
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <span className="font-medium">Color:</span>
                                  <span>
                                    {item.layoutData?.canvas.materialColor}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pb-4 mb-4 border-b border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ${(pricing?.totals.customerSubtotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {(pricing?.totals.discountAmount ?? 0) > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-700 font-medium">
                          Discount (
                          {(
                            (pricing?.totals.discountPct ?? 0) * 100 || 0
                          ).toFixed(0)}
                          %)
                        </span>
                        <span className="font-semibold text-green-700">
                          -${(pricing?.totals.discountAmount ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-700">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          You saved $
                          {(pricing?.totals.discountAmount ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      ${(pricing?.totals.shippingCost ?? 0).toFixed(2)}
                    </span>
                  </div> */}
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full bg-primary text-white py-3.5 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-md"
                  onClick={handleSubmitOrder}
                  disabled={
                    isSubmitting ||
                    loading ||
                    cartItems.filter((item) => item.selected).length === 0
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Redirecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Proceed to Checkout
                    </span>
                  )}
                </button>

                {cartItems.filter((item) => item.selected).length === 0 && (
                  <p className="text-sm text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Select items to submit an order
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showDisclaimer && (
        <Modal
          isOpen={showDisclaimer}
          title="Disclaimer"
          description={DISCLAIMER_TEXT}
          onCancel={() => {
            setShowDisclaimer(false);
            setPendingCheckoutItems([]);
          }}
          onConfirm={() => {
            const qs = encodeURIComponent(pendingCheckoutItems.join(","));
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
