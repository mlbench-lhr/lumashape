"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null); // Initial state is null to indicate loading

  useEffect(() => {
    const storedTab = sessionStorage.getItem("activeTab") || "/";
    setActiveTab(storedTab); // Load value from localStorage
  }, []);

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab]);

  return (
    <TabContext.Provider value={{ activeTab: activeTab || "/", setActiveTab }}>
      {activeTab !== null && children} {/* Render children only when state is ready */}
    </TabContext.Provider>
  );
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};
