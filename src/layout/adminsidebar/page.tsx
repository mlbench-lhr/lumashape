"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from '@/context/UserContext';
import CloseButton from "@/components/ui/CloseButton"; // Adjust path as needed
import { Settings, User, ShoppingCart, Layout } from "lucide-react";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    iconActive?: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
    {
        icon: <Layout className="w-5 h-5 text-gray-600" />,
        iconActive: <Layout className="w-5 h-5 text-white" />,
        name: "Dashboard",
        path: "/admin/dashboard",
    },
    {
        icon: <User className="w-5 h-5 text-gray-600" />,
        iconActive: <User className="w-5 h-5 text-white" />,
        name: "All Users",
        path: "/admin/users"
    },
    {
        icon: <ShoppingCart className="w-5 h-5 text-gray-600" />,
        iconActive: <ShoppingCart className="w-5 h-5 text-white" />,
        name: "All Orders",
        path: "/admin/orders"
    },
    {
        icon: <Settings className="w-5 h-5 text-gray-600" />,
        iconActive: <Settings className="w-5 h-5 text-white" />,
        name: "Settings",
        path: "/admin/settings",
    },
];

const othersItems: NavItem[] = [];

const AdminAppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
    const pathname = usePathname();
    const { user } = useUser();

    console.log("User:", user);

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "others";
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const isActive = useCallback((path: string) => {
        if (!path) return false;
        const p = path.endsWith('/') ? path.slice(0, -1) : path;
        const cur = pathname?.endsWith('/') ? pathname.slice(0, -1) : pathname;
        if (cur === p) return true;
        return cur?.startsWith(p + '/') || cur?.startsWith(p + '?');
    }, [pathname]);

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
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    // Close mobile sidebar when clicking on a link
    const handleLinkClick = () => {
        if (isMobileOpen) {
            toggleMobileSidebar();
        }
    };

    const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
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

    const renderMenuItems = (
        navItems: NavItem[],
        menuType: "main" | "others"
    ) => (
        <ul className="font-raleway flex flex-col gap-4">
            {navItems.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`group w-full flex items-center gap-4 p-3 transition-colors cursor-pointer rounded-lg ${!isExpanded && !isHovered && !isMobileOpen
                                ? "lg:justify-center"
                                : "lg:justify-start"
                                }`}
                        >
                            <span className={`transition-all duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                ? "text-primary"
                                : "text-gray-600"
                                }`}>
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className={`font-medium transition-colors ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "text-primary"
                                    : "text-gray-700"
                                    }`}>
                                    {nav.name}
                                </span>
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                href={nav.path}
                                onClick={handleLinkClick}
                                className={`group flex items-center gap-4 w-full p-3 transition-colors rounded-lg ${!isExpanded && !isHovered && !isMobileOpen
                                    ? "lg:justify-center"
                                    : "lg:justify-start"
                                    } ${isActive(nav.path) ? "bg-primary text-white" : ""
                                    }`}
                            >
                                <span className="transition-all duration-200">
                                    {isActive(nav.path) ? nav.iconActive : nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className={`font-medium transition-colors ${isActive(nav.path) ? "text-white" : "text-gray-700"
                                        }`}>
                                        {nav.name}
                                    </span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
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
                                            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-md ${isActive(subItem.path) ? "bg-primary text-white" : ""
                                                }`}
                                        >
                                            <span className={`${isActive(subItem.path) ? "text-primary font-medium" : "text-gray-600"
                                                }`}>
                                                {subItem.name}
                                            </span>
                                            <span className="flex items-center gap-1 ml-auto">
                                                {subItem.new && (
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${isActive(subItem.path)
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-gray-100 text-gray-600"
                                                            }`}
                                                    >
                                                        new
                                                    </span>
                                                )}
                                                {subItem.pro && (
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${isActive(subItem.path)
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
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed flex flex-col top-0 left-0 bg-white text-gray-900 h-screen transition-all duration-300 ease-in-out z-40 border-r border-gray-200 
        ${isMobileOpen
                    ? "w-[290px] translate-x-0"
                    : isExpanded || isHovered
                        ? "w-[290px] lg:translate-x-0"
                        : "w-[90px] lg:translate-x-0"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        px-5`}
            onMouseEnter={() => !isExpanded && !isMobileOpen && setIsHovered(true)}
            onMouseLeave={() => !isMobileOpen && setIsHovered(false)}
        >
            {/* Header with Logo and Close Button */}
            <div className="py-8 flex items-center pl-8 justify-start">
                <div className={`flex ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center" : "justify-start"
                    }`}>
                    <Link href="/admin/dashboard" onClick={handleLinkClick}>
                        {
                            <>
                                <Image
                                    src="/images/logo/lumashape.svg"
                                    alt="Lumashape Logo"
                                    width={175}
                                    height={47}
                                />
                            </>
                        }
                    </Link>
                </div>

                {/* Close Button - Only visible on mobile when sidebar is open */}
                <CloseButton />
            </div>

            {/* Navigation Content */}
            <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="flex-1">
                    <div className="flex flex-col gap-4 justify-between h-full">
                        <div>
                            {renderMenuItems(navItems, "main")}
                            {othersItems.length > 0 && renderMenuItems(othersItems, "others")}
                        </div>

                        {/* User Profile Section removed per design: user info goes in top bar */}
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AdminAppSidebar;