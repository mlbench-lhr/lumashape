"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Bell } from 'lucide-react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import HamburgerMenu from '@/components/ui/HamburgerMenu';

// ------------------
// Types
// ------------------

interface UserData {
    username?: string;
    email?: string;
    imgUrl?: string;
    avatarPublicId?: string;
    avatar?: string;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
}

// ------------------
// Component
// ------------------

export const Header = () => {
    const [adminUser, setAdminUser] = useState<UserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    useEffect(() => {
        try {
            const raw = localStorage.getItem("admin-profile");
            if (raw) setAdminUser(JSON.parse(raw));
        } catch {}
        setLoadingUser(false);
    }, []);

    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLElement | null>(null);
    const [drawerTop, setDrawerTop] = useState(0);

    const username = adminUser?.username ?? "Admin";
    const email = adminUser?.email ?? "—";

    const initials = (username || "A")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const cloudName = process.env.NEXT_PUBLIC_CL0UDINARY_CLOUD_NAME;
    const avatarPublicId = adminUser?.avatarPublicId;
    const imgUrl = typeof adminUser?.imgUrl === "string" ? adminUser.imgUrl.trim() : "";

    const rawAvatar = adminUser?.avatar;
    const safeRawAvatar =
        typeof rawAvatar === "string" ? rawAvatar.replace(/`/g, "").trim() : "";

    const avatar =
        imgUrl ||
        (cloudName && avatarPublicId
            ? `https://res.cloudinary.com/${cloudName}/image/upload/w_40,h_40,c_fill,q_auto,f_auto,dpr_auto/${avatarPublicId}`
            : safeRawAvatar);

    const formatAgo = (ts: string) => {
        const d = new Date(ts);
        const diff = Math.max(0, Date.now() - d.getTime());
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m Ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h Ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d Ago`;
    };

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
                setIsNotifOpen(false);
            }
        };
        if (isMenuOpen || isNotifOpen) {
            document.addEventListener("mousedown", onDocClick);
        }
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [isMenuOpen, isNotifOpen]);

    useEffect(() => {
        const updateTop = () => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect();
                setDrawerTop(Math.max(0, Math.round(rect.bottom)));
            }
        };
        if (isNotifOpen) {
            updateTop();
            window.addEventListener("resize", updateTop);
            window.addEventListener("scroll", updateTop);
        }
        return () => {
            window.removeEventListener("resize", updateTop);
            window.removeEventListener("scroll", updateTop);
        };
    }, [isNotifOpen]);

    return (
        <header
            className="border-b border-gray-200 px-6 py-2 bg-white"
            ref={headerRef}
        >
            <div className="flex items-center w-full">
                <div className="flex items-center">
                    <HamburgerMenu />
                </div>

                <div
                    className="flex items-center gap-4 relative ml-auto"
                    ref={dropdownRef}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-sm md:text-base font-semibold text-gray-900">
                                {loadingUser ? "Loading…" : username}
                            </div>
                        </div>

                        {avatar ? (
                            <img
                                src={avatar}
                                alt="User avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold"
                                aria-label="User avatar"
                            >
                                {initials}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsNotifOpen((v) => !v)}
                        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Image src="/images/icons/bell.svg" width={36} height={36} alt="" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[11px] leading-[18px] text-center font-semibold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div
                            className="fixed right-0 bottom-0 z-50"
                            style={{ top: drawerTop }}
                        >
                            <div className="h-full bg-[#FEF0ED] w-[350px] sm:w-[380px] md:w-[420px] border-t border-[#EED4CF] shadow-xl overflow-y-auto">
                                <div className="max-w-7xl mx-auto p-5">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Notifications
                                    </h3>

                                    {notifLoading ? (
                                        <div className="text-sm text-gray-700">Loading…</div>
                                    ) : notifItems.length === 0 ? (
                                        <div className="text-sm text-gray-700">
                                            No notifications
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {notifItems.map((n) => (
                                                <div key={n.id} className="flex items-start gap-3">
                                                    <div className="rounded-full bg-[#E39780] flex items-center justify-center">
                                                        <Image
                                                            src="/images/icons/bell.svg"
                                                            width={40}
                                                            height={40}
                                                            alt="Bell"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-black/70 text-sm">{n.message}</p>
                                                        <p className="text-black/80 text-xs mt-1">
                                                            {formatAgo(n.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
