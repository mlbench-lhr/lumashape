"use client";
import React, { createContext, useState, useEffect, ReactNode, useContext } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

// Define User interface with all fields
export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  image?: string;
  avatar?: string;
  avatarPublicId?: string;
  profilePic?: string;
  phone?: string | null;
  company?: string | null;
  description?: string | null;
  isVerified: boolean;
  isPublic?: boolean;
  // Subscription fields
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionPlan?: 'Free' | 'Pro' | 'Premium' | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | null;
  subscriptionPeriodEnd?: string | null;
}

// Define UserContext interface
interface UserContextType {
  user: User | null;
  login: (token: string) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  isSubscribed: () => boolean;
  isPremium: () => boolean;
  isLoading: boolean;
}

// Create context
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Function to refresh user data
  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;
  
      const response = await axios.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data && response.data.user) {
        // Map the API response to match our User interface
        const userData = response.data.user;
        setUser({
          _id: userData._id || "",
          username: userData.name || userData.username || "",
          name: userData.name || userData.username || "",
          email: userData.email || "",
          avatar: userData.avatar,
          profilePic: userData.profilePic,
          image: userData.image,
          avatarPublicId: userData.avatarPublicId,
          phone: userData.phone,
          company: userData.company,
          description: userData.description || userData.bio,
          isVerified: userData.isVerified || true,
          isPublic: userData.isPublic,
          stripeCustomerId: userData.stripeCustomerId,
          subscriptionId: userData.subscriptionId,
          subscriptionPlan: userData.subscriptionPlan,
          subscriptionStatus: userData.subscriptionStatus,
          subscriptionPeriodEnd: userData.subscriptionPeriodEnd,
        });
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

      if (response.data.success && user) {
        setUser({
          ...user,
          subscriptionPlan: response.data.subscriptionPlan,
          subscriptionStatus: response.data.subscriptionStatus,
          subscriptionPeriodEnd: response.data.subscriptionPeriodEnd,
        });
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error);
    }
  };

  // Function to check if user is subscribed
  const isSubscribed = () => {
    return user?.subscriptionStatus === 'active' && 
           (user?.subscriptionPlan === 'Pro' || user?.subscriptionPlan === 'Premium');
  };

  // Function to check if user has premium subscription
  const isPremium = () => {
    return user?.subscriptionStatus === 'active' && user?.subscriptionPlan === 'Premium';
  };

  // Function to login
  const login = (token: string) => {
    localStorage.setItem("auth-token", token);
    Cookies.set("auth-token", token, { expires: 7 });
    refreshUser();
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem("auth-token");
    Cookies.remove("auth-token");
    setUser(null);
    router.push("/auth/login");
  };

  // Load user data on mount
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      refreshUser();
    }
  }, []);

  const value: UserContextType = {
    user,
    login,
    setUser,
    logout,
    refreshUser,
    refreshSubscription,
    isSubscribed,
    isPremium,
    isLoading: false,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
