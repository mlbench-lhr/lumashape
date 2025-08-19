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
  avatarPublicId?: string; // NEW
}

interface UserContextType {
  user: User | null;
  token: string;
  setUser: (user: User | null) => void;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  updateUserSubscription: (subscription: Partial<User>) => void; // New function to update subscription
}

interface UserProviderProps {
  children: ReactNode;
}

// 2. Create context with default empty values
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  token: "",
  login: () => {},
  logout: () => {},
  loading: true,
  updateUserSubscription: () => {},
});

// 3. Context Provider Component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = async () => {
    const savedToken = localStorage.getItem("auth-token");

    try {
      const response = await axios.get<User>("/api/user/auth/fetch-user", {
        withCredentials: true, // ✅ needed for cookie
        headers: {
          Authorization: `Bearer ${savedToken}`, // Include token in headers
        },
      });
      setUser(response.data);
    } catch (err) {
      console.error("User fetch failed:", err);
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 401 || err.response?.status === 403)
      ) {
        setUser(null);
        Cookies.remove("auth-token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("auth-token");
    if (savedToken && savedToken.trim() !== "") {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [pathname]);

  const login = async (newToken: string) => {
    localStorage.setItem("auth-token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    Cookies.remove("auth-token");
    localStorage.removeItem("auth-token");
    router.push("/auth/login");
    setToken("");
    setUser(null);
  };

  const updateUserSubscription = (subscription: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...subscription };
      setUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        token,
        login,
        logout,
        loading,
        updateUserSubscription,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
