"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

// 1. Define types
export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  image?: string;
  plan?: string | null;
  description?: string | null;
  charges?: number | null;
  subscription_id?: string | null;
  hasSubscribed?: string;
  expiry_date?: Date | null;
  phone?: string | null;
  company?: string | null;
  avatar?: string | null;
  avatarPublicId?: string;
}

export interface Subscription {
  plan_name?: string | null;
  hasSubscribed?: string;
  expiry_date?: Date | null;
  charges?: number;
  subscription_id?: string | null;
}

interface UserContextType {
  user: User | null;
  subscription: Subscription | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

// 2. Create context
export const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const response = await axios.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Function to refresh subscription data
  const refreshSubscription = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const response = await axios.get("/api/user/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.subscription) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error);
    }
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem("auth-token");
    Cookies.remove("auth-token");
    setUser(null);
    setSubscription(null);
    router.push("/auth/login");
  };

  // Load user data on mount and token change
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      refreshUser();
      refreshSubscription();
    }
  }, []);

  // Auto-refresh subscription when user changes
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  const value: UserContextType = {
    user,
    subscription,
    setUser,
    setSubscription,
    logout,
    refreshUser,
    refreshSubscription,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 4. Custom hook
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

function useContext(UserContext: React.Context<UserContextType | undefined>): UserContextType {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
