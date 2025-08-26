"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import { usePathname } from "next/navigation";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Define routes where sidebar should be hidden
  const hideSidebarRoutes = [
    "/annotations/cell-segmentation", // Exact match
    "/annotations/cell-segmentation/", // With trailing slash
    // Add more exact routes as needed
  ];

  // Define route prefixes where sidebar should be hidden (for wildcard matching)
  const hideSidebarPrefixes = [
    "/annotations/cell-segmentation/", // Any route starting with this
    // Add more prefixes as needed
  ];

  // Check if current path should hide sidebar
  const shouldHideSidebar =
    hideSidebarRoutes.includes(pathname) || // Exact match
    hideSidebarPrefixes.some((prefix) => pathname.startsWith(prefix)); // Prefix match

  // Alternative approach using a single function for more complex matching:
  // const shouldHideSidebar = checkIfShouldHideSidebar(pathname);

  // Dynamic margin for responsive layout
  const sidebarMargin = shouldHideSidebar
    ? "ml-0" // No margin when sidebar is hidden
    : isMobileOpen
    ? "ml-0" // No margin on mobile when sidebar is open
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen flex">
      {/* Conditionally render sidebar components */}
      {!shouldHideSidebar && (
        <>
          {/* Hamburger Menu - Only visible on mobile */}
          <HamburgerMenu />

          {/* Sidebar and Backdrop */}
          <AppSidebar />
          <Backdrop />
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${sidebarMargin} px-4 md:px-6 ${
          shouldHideSidebar ? "pt-0" : "pt-16 lg:pt-0"
        } bg-[#FAFAFA]`}
      >
        <div className="flex justify-center min-h-screen">
          <div className="w-full max-w-screen-xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
