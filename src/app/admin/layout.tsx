"use client";

import { useSidebar, SidebarProvider } from "@/context/SidebarContext";
import AdminAppSidebar from "@/layout/adminsidebar/page";
import Backdrop from "@/layout/Backdrop";

import { Header } from "@/components/admin/header/page";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useUser } from "@/context/UserContext";

// Header no longer accepts title/description; page heading moves into each page component.

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  // No page info needed for Header; top bar shows user info only.

  // Allow admin login page without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Dynamic sidebar margin
  const sidebarMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen flex">

      <AdminAppSidebar />
      <Backdrop />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${sidebarMargin} bg-white`}
      >
        <Header />
        <div className="px-4 md:px-6">
          <div className="flex justify-center">
            <div className="w-full max-w-screen-xl">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
