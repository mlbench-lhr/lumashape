"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  iconActive?: React.ReactNode;
  path?: string;
};

interface User {
  username: string;
  email: string;
}

const navItems: NavItem[] = [
  {
    icon: (
      <Image
        src="/images/icons/sidebar/workspace.svg"
        alt="Workspace"
        width={24}
        height={24}
      />
    ),
    iconActive: (
      <Image
        src="/images/icons/sidebar/active/workspace.svg"
        alt="Workspace Active"
        width={24}
        height={24}
      />
    ),
    name: "Workspace",
    path: "/workspace",
  },
  {
    icon: (
      <Image
        src="/images/icons/sidebar/tools.svg"
        alt="Tools"
        width={24}
        height={24}
      />
    ),
    iconActive: (
      <Image
        src="/images/icons/sidebar/active/tools.svg"
        alt="Tools Active"
        width={24}
        height={24}
      />
    ),
    name: "Tools Inventory",
    path: "/tools-inventory",
  },
  {
    icon: (
      <Image
        src="/images/icons/sidebar/explore.svg"
        alt="Explore"
        width={24}
        height={24}
      />
    ),
    iconActive: (
      <Image
        src="/images/icons/sidebar/active/explore.svg"
        alt="Explore Active"
        width={24}
        height={24}
      />
    ),
    name: "Explore",
    path: "/explore",
  },
  {
    icon: (
      <Image
        src="/images/icons/sidebar/cart.svg"
        alt="Cart"
        width={24}
        height={24}
      />
    ),
    iconActive: (
      <Image
        src="/images/icons/sidebar/active/cart.svg"
        alt="Cart Active"
        width={24}
        height={24}
      />
    ),
    name: "Cart",
    path: "/cart",
  },
  {
    icon: (
      <Image
        src="/images/icons/sidebar/profile.svg"
        alt="Profile"
        width={24}
        height={24}
      />
    ),
    iconActive: (
      <Image
        src="/images/icons/sidebar/active/profile.svg"
        alt="Profile Active"
        width={24}
        height={24}
      />
    ),
    name: "Profile",
    path: "/profile",
  },
];

const DesignLayoutAppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = useCallback(
    (path: string) => {
      if (!path) return false;
      
      // Exact match or with trailing slash
      if (pathname === path || pathname === `${path}/`) {
        return true;
      }
      
      // Check for nested paths under workspace and tools-inventory
      if (path === '/workspace') {
        return pathname.startsWith('/workspace/');
      }
      
      if (path === '/tools-inventory') {
        return pathname.startsWith('/tools-inventory/');
      }
      
      return false;
    },
    [pathname]
  );

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="font-raleway flex flex-col gap-4">
      {navItems.map((nav) => {
        return (
          <li key={nav.name}>
            {nav.path && (
              <Link
                href={nav.path}
                className={`group flex items-center justify-center w-full p-3 transition-colors rounded-lg hover:bg-gray-50 ${
                  isActive(nav.path) ? "bg-primary/5" : ""
                }`}
                title={nav.name} // Always show tooltip for icon-only mode
              >
                <span className="transition-all duration-200">
                  {isActive(nav.path) ? nav.iconActive : nav.icon}
                </span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className="fixed flex flex-col top-0 left-0 bg-white text-gray-900 h-full w-[90px] z-40 border-r border-gray-200 px-5"
    >
      {/* Header with Logo */}
      <div className="py-8 flex items-center justify-center">
        <Link href="/">
          <Image
            src="/images/logo/lumashape_logo.svg"
            alt="Lumashape Logo"
            width={175}
            height={47}
          />
        </Link>
      </div>

      {/* Navigation Content */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="flex-1">
          <div className="flex flex-col gap-4 justify-between h-full">
            <div>
              {renderMenuItems(navItems)}
            </div>

            {/* User Profile Section */}
            <div className="mt-auto pb-4">
              <div
                className="flex items-center justify-center p-3 transition-colors rounded-lg"
                title={user?.username || "User Profile"}
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        {user?.username
                          ? user.username.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default DesignLayoutAppSidebar;