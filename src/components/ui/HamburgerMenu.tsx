"use client";
import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { FaBars } from "react-icons/fa";

const HamburgerMenu: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  // Only show hamburger when sidebar is closed
  if (isMobileOpen) return null;

  return (
    <button
      onClick={toggleMobileSidebar}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      aria-label="Open menu"
    >
      <FaBars className="h-6 w-6 text-primary" />
    </button>
  );
};

export default HamburgerMenu;