"use client";

import { useSidebar } from "@/context/SidebarContext";
import NormalAppSidebar from "@/layout/NormalAppSideBar/AppSidebar";
import DesignLayoutAppSidebar from "@/layout/IconOnlyAppSideBar/AppSideBar";
import Backdrop from "@/layout/Backdrop";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("auth-token")) {
      router.push("/auth/login");
    }
  }, []);

  const hideSidebarRoutes = [
    "/annotations/cell-segmentation",
    "/annotations/cell-segmentation/",
  ];
  const hideSidebarPrefixes = [
    "/annotations/cell-segmentation/",
  ];
  const shouldHideSidebar =
    hideSidebarRoutes.includes(pathname) ||
    hideSidebarPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isDesignLayoutRoute =
    pathname === '/workspace/create-new-layout/design-layout' ||
    pathname === '/workspace/create-new-layout/design-layout/' ||
    pathname.startsWith('/workspace/edit-layout/');
  const sidebarMargin = shouldHideSidebar
    ? "ml-0"
    : isMobileOpen
      ? "ml-0"
      : isDesignLayoutRoute
        ? "lg:ml-[90px]" // ✅ match DesignLayoutAppSidebar width
        : isExpanded || isHovered
          ? "lg:ml-[290px]"
          : "lg:ml-[90px]";



  return (
    <div className="min-h-screen flex">
      {!shouldHideSidebar && (
        <>
          {!isDesignLayoutRoute && <HamburgerMenu />}
          {isDesignLayoutRoute ? (
            <DesignLayoutAppSidebar />
          ) : (
            <>
              <NormalAppSidebar />
              <Backdrop />
            </>
          )}
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${sidebarMargin} ${shouldHideSidebar ? "pt-0" : isDesignLayoutRoute ? "pt-0" : "pt-16 lg:pt-0"
          } bg-[#FAFAFA] ${isDesignLayoutRoute ? "px-0" : "px-4 md:px-6"}`}
      >
        <div className={`flex min-h-screen w-full ${isDesignLayoutRoute ? "" : "justify-center"}`}>
          <div className={`${isDesignLayoutRoute ? "w-full" : "w-full max-w-screen-xl"}`}>
            {children}
          </div>
        </div>
      </main>



    </div>
  );
}