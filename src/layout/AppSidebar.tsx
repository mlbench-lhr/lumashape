"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { UserContext } from "@/context/UserContext";
import CloseButton from "@/components/ui/CloseButton"; // Adjust path as needed

type NavItem = {
  name: string;
  icon: React.ReactNode;
  iconActive?: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
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

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const pathname = usePathname();
  const { user } = useContext(UserContext);
  const [token, setToken] = useState("");

  console.log("User:", user);

  // Check if we're on the design layout route
  const isDesignLayoutRoute = pathname === '/workspace/create-new-layout/design-layout' || 
                             pathname === '/workspace/create-new-layout/design-layout/';

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (!path) return false;
      return pathname === path || pathname === `${path}/`;
    },
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;

    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    othersItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "others",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null && !isDesignLayoutRoute) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu, isDesignLayoutRoute]);

  // Close mobile sidebar when clicking on a link
  const handleLinkClick = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    // Don't allow submenu toggle on design layout route
    if (isDesignLayoutRoute) return;
    
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Determine if sidebar should be collapsed (icons only)
  const shouldShowIconsOnly = isDesignLayoutRoute || (!isExpanded && !isHovered && !isMobileOpen);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="font-raleway flex flex-col gap-4">
      {navItems.map((nav, index) => {
        // Special handling for workspace icon on design layout route
        let iconToShow = nav.icon;
        let activeIconToShow = nav.iconActive;
        
        if (nav.name === "Workspace" && isDesignLayoutRoute) {
          iconToShow = (
            <Image
              src="/images/icons/sidebar/workspace.svg"
              alt="Workspace"
              width={24}
              height={24}
            />
          );
          activeIconToShow = (
            <Image
              src="/images/icons/sidebar/active/workspace.svg"
              alt="Workspace Active"
              width={24}
              height={24}
            />
          );
        }
        
        return (
          <li key={nav.name}>
            {nav.subItems && !isDesignLayoutRoute ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`group w-full flex items-center gap-4 p-3 transition-colors cursor-pointer hover:bg-gray-50 rounded-lg ${
                  shouldShowIconsOnly ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`transition-all duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "text-primary"
                      : "text-gray-600"
                  }`}
                >
                  {iconToShow}
                </span>
                {!shouldShowIconsOnly && (
                  <span
                    className={`font-medium transition-colors ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "text-primary"
                        : "text-gray-700"
                    }`}
                  >
                    {nav.name}
                  </span>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  onClick={handleLinkClick}
                  className={`group flex items-center gap-4 w-full p-3 transition-colors rounded-lg ${
                    shouldShowIconsOnly ? "lg:justify-center" : "lg:justify-start"
                  } hover:bg-gray-50 ${isActive(nav.path) ? "bg-primary/5" : ""}`}
                  title={shouldShowIconsOnly ? nav.name : undefined} // Add tooltip for icon-only mode
                >
                  <span className="transition-all duration-200">
                    {isActive(nav.path) ? activeIconToShow : iconToShow}
                  </span>
                  {!shouldShowIconsOnly && (
                    <span
                      className={`font-medium transition-colors ${
                        isActive(nav.path) ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {nav.name}
                    </span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && !shouldShowIconsOnly && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        onClick={handleLinkClick}
                        className={`flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 rounded-md ${
                          isActive(subItem.path) ? "bg-gray-50" : ""
                        }`}
                      >
                        <span
                          className={`${
                            isActive(subItem.path)
                              ? "text-primary font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {subItem.name}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                isActive(subItem.path)
                                  ? "bg-primary/10 text-primary"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                isActive(subItem.path)
                                  ? "bg-primary/10 text-primary"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed flex flex-col top-0 left-0 bg-white text-gray-900 h-full transition-all duration-300 ease-in-out z-40 border-r border-gray-200 
        ${
          isMobileOpen
            ? "w-[290px] translate-x-0"
            : isDesignLayoutRoute
            ? "w-[90px] lg:translate-x-0"
            : isExpanded || isHovered
            ? "w-[290px] lg:translate-x-0"
            : "w-[90px] lg:translate-x-0"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        px-5`}
      onMouseEnter={() => !isDesignLayoutRoute && !isExpanded && !isMobileOpen && setIsHovered(true)}
      onMouseLeave={() => !isDesignLayoutRoute && !isMobileOpen && setIsHovered(false)}
    >
      {/* Header with Logo and Close Button */}
      <div className="py-8 flex items-center justify-between">
        <div
          className={`flex ${
            shouldShowIconsOnly ? "lg:justify-center" : "justify-start"
          }`}
        >
          <Link href="/" onClick={handleLinkClick}>
            {!shouldShowIconsOnly ? (
              <>
                <Image
                  className="dark:hidden ml-3"
                  src="/images/logo/lumashape.svg"
                  alt="Lumashape Logo"
                  width={175}
                  height={47}
                />
                <Image
                  className="hidden dark:block ml-3"
                  src="/images/logo/lumashape.svg"
                  alt="Lumashape Logo"
                  width={175}
                  height={47}
                />
              </>
            ) : (
              <Image
                className=""
                src="/images/logo/lumashape_logo.svg"
                alt="Lumashape Logo"
                width={175}
                height={47}
              />
            )}
          </Link>
        </div>

        {/* Close Button - Only visible on mobile when sidebar is open */}
        {!isDesignLayoutRoute && <CloseButton />}
      </div>

      {/* Navigation Content */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="flex-1">
          <div className="flex flex-col gap-4 justify-between h-full">
            <div>
              {renderMenuItems(navItems, "main")}
              {othersItems.length > 0 && renderMenuItems(othersItems, "others")}
            </div>

            {/* User Profile Section */}
            <div className="mt-auto pb-4">
              <div
                className={`flex items-center gap-3 p-3 transition-colors hover:bg-gray-50 rounded-lg ${
                  shouldShowIconsOnly ? "lg:justify-center" : "lg:justify-start"
                }`}
                title={shouldShowIconsOnly ? (user?.username || "User Profile") : undefined}
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
                {!shouldShowIconsOnly && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-[16px] text-gray-900 truncate">
                      {user ? user.username : ""}
                    </span>
                    <span className="font-medium text-[12px] text-[#808080] truncate">
                      {user ? user.email : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;