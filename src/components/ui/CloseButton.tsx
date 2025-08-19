"use client";
import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { FaTimes } from "react-icons/fa";


const CloseButton: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  // Only show close button when sidebar is open on mobile
  if (!isMobileOpen) return null;

  return (
    <button
      onClick={toggleMobileSidebar}
      className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
      aria-label="Close menu"
    >
    <FaTimes className="h-6 w-6 text-primary" />
    </button>
  );
};

export default CloseButton;