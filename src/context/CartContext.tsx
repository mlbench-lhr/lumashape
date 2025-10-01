"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

// Define the cart item interface based on layout structure
export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  containerSize: string;
  price: number;
  snapshotUrl?: string;
  quantity: number;
  selected: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity" | "selected">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelected: (id: string, selected: boolean) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearCart: () => void;
  totalPrice: number;
}

interface CartProviderProps {
  children: ReactNode;
}

// Create context with default values
export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  toggleSelected: () => {},
  toggleSelectAll: () => {},
  clearCart: () => {},
  totalPrice: 0,
});

// Cart Provider Component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart data:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    
    // Calculate total price
    const total = cartItems.reduce((sum, item) => {
      return item.selected ? sum + (item.price * item.quantity) : sum;
    }, 0);
    
    setTotalPrice(total);
  }, [cartItems]);

  // Add item to cart
  const addToCart = (item: Omit<CartItem, "quantity" | "selected">) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Add new item with quantity 1
        return [...prevItems, { ...item, quantity: 1, selected: true }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Toggle item selection
  const toggleSelected = (id: string, selected: boolean) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, selected } : item
      )
    );
  };

  // Toggle select all items
  const toggleSelectAll = (selected: boolean) => {
    setCartItems(prevItems => 
      prevItems.map(item => ({ ...item, selected }))
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelected,
        toggleSelectAll,
        clearCart,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for using cart context
export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};