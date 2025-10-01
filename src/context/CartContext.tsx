"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "./UserContext";

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
  layoutData?: {
    canvas: {
      width: number;
      height: number;
      unit: 'mm' | 'inches';
      thickness: number;
    };
    tools: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      rotation: number;
      flipHorizontal: boolean;
      flipVertical: boolean;
      thickness: number;
      unit: 'mm' | 'inches';
      opacity: number;
      smooth: number;
      image: string;
      groupId?: string | null;
    }>;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity" | "selected">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  toggleSelected: (id: string, selected: boolean) => Promise<void>;
  toggleSelectAll: (selected: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  totalPrice: number;
  loading: boolean;
  syncCart: () => Promise<void>;
}

interface CartProviderProps {
  children: ReactNode;
}

// Create context with default values
export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  toggleSelected: async () => {},
  toggleSelectAll: async () => {},
  clearCart: async () => {},
  totalPrice: 0,
  loading: false,
  syncCart: async () => {},
});

// Cart Provider Component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUser();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Sync cart from database
  const syncCart = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('No auth token found, clearing cart');
        setCartItems([]);
        setTotalPrice(0);
        return;
      }

      console.log('Syncing cart with token:', token.substring(0, 20) + '...');

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Cart data received:', data);
        setCartItems(data.cart.items || []);
        setTotalPrice(data.cart.totalPrice || 0);
      } else {
        console.error('Failed to fetch cart:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load cart when component mounts or when auth token changes
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      console.log('Auth token found, syncing cart');
      syncCart();
    } else {
      console.log('No auth token, clearing cart');
      setCartItems([]);
      setTotalPrice(0);
    }
  }, [user]); // Keep user dependency to trigger when user loads/changes

  // Also sync cart on mount regardless of user state
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      console.log('Component mounted with auth token, syncing cart');
      syncCart();
    }
  }, []); // Run once on mount

  // Calculate total price whenever cart items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      return item.selected ? sum + (item.price * item.quantity) : sum;
    }, 0);
    setTotalPrice(total);
  }, [cartItems]);

  // Add item to cart
  const addToCart = async (item: Omit<CartItem, "quantity" | "selected">) => {
    const token = getAuthToken();
    
    // Check for authentication - either user object or token should exist
    if (!user && !token) {
      throw new Error("Please log in to add items to cart");
    }

    // If we have a token but no user yet, try to refresh user data first
    if (!user && token) {
      // This might be a timing issue where user context hasn't loaded yet
      // We'll proceed with the token but also trigger a user refresh
      console.warn("User context not loaded yet, proceeding with token authentication");
    }

    try {
      setLoading(true);
      if (!token) throw new Error("Authentication required");

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        await syncCart(); // Refresh cart from database
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token for removeFromCart');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/cart?itemId=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Item removed successfully, syncing cart');
        await syncCart(); // Refresh cart from database
      } else {
        console.error('Failed to remove item:', response.status);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token for updateQuantity');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: id,
          updates: { quantity }
        }),
      });

      if (response.ok) {
        console.log('Quantity updated successfully, syncing cart');
        await syncCart(); // Refresh cart from database
      } else {
        console.error('Failed to update quantity:', response.status);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle item selection
  const toggleSelected = async (id: string, selected: boolean) => {
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token for toggleSelected');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: id,
          updates: { selected }
        }),
      });

      if (response.ok) {
        console.log('Selection toggled successfully, syncing cart');
        await syncCart(); // Refresh cart from database
      } else {
        console.error('Failed to toggle selection:', response.status);
      }
    } catch (error) {
      console.error('Error toggling selection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle select all items
  const toggleSelectAll = async (selected: boolean) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Update all items locally first for immediate feedback
      setCartItems(prevItems => 
        prevItems.map(item => ({ ...item, selected }))
      );

      // Then sync each item with database
      const token = getAuthToken();
      if (!token) return;

      const updatePromises = cartItems.map(item =>
        fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
            updates: { selected }
          }),
        })
      );

      await Promise.all(updatePromises);
      await syncCart(); // Final sync to ensure consistency
    } catch (error) {
      console.error('Error toggling select all:', error);
      // Revert local changes on error
      await syncCart();
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCartItems([]);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
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
        totalPrice,
        loading,
        syncCart
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