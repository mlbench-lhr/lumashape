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

  // Routes where sidebar should be hidden
  const hideSidebarRoutes = [
    "/annotations/cell-segmentation",
    "/annotations/cell-segmentation/",
  ];

  const hideSidebarPrefixes = ["/annotations/cell-segmentation/"];

  // Compact sidebar only for design layout route
  const isDesignLayoutRoute =
    pathname === "/workspace/create-new-layout/design-layout" ||
    pathname === "/workspace/create-new-layout/design-layout/" ||
    pathname === "/create-new-layout/design-layout" ||
    pathname === "/create-new-layout/design-layout/";

  const shouldHideSidebar =
    hideSidebarRoutes.includes(pathname) ||
    hideSidebarPrefixes.some((prefix) => pathname.startsWith(prefix));

  // Sidebar width logic
  const getSidebarWidth = () => {
    if (isDesignLayoutRoute) return 70; // compact
    if (isExpanded || isHovered) return 290; // expanded
    return 90; // collapsed
  };

  const sidebarWidth = shouldHideSidebar ? 0 : getSidebarWidth();
  const extraLeftMargin = 20;

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative">
      {/* Sidebar (absolute, overlays, does not take flex space) */}
      {!shouldHideSidebar && (
        <>
          {!isDesignLayoutRoute && <HamburgerMenu />}
          <div
            className="fixed top-0 left-0 h-full z-40 transition-all duration-300"
            style={{ width: `${sidebarWidth}px` }}
          >
            <AppSidebar />
          </div>
          <Backdrop />
        </>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          isDesignLayoutRoute ? "bg-white" : "bg-[#FAFAFA]"
        }`}
        style={{
          marginLeft: `${sidebarWidth + extraLeftMargin}px`, // 👈 push content extra from left
          width: `calc(100% - ${sidebarWidth + extraLeftMargin}px)`, // take rest of the screen
        }}
      >
        <div
          className={`${
            isDesignLayoutRoute ? "flex h-full" : "flex min-h-screen justify-start"
          }`}
        >
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
