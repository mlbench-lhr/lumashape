"use client";
import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { FaBars } from "react-icons/fa";
import Image from "next/image";

const HamburgerMenu: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  // Only show hamburger when sidebar is closed
  if (isMobileOpen) return null;

  return (
    <>
      <div className="fixed w-[375px] h-[44px] flex top-4 left-4 z-50 p-2 sm:hidden">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden rounded-md bg-white cursor-pointer"
          aria-label="Open menu"
        >
          <FaBars className="h-6 w-6 text-primary" />
        </button>

        <div className="flex justify-center items-center grow gap-[5px]">
          <div className="relative w-[32px] h-[32px]">
            <Image src="/images/icons/logo.svg" fill alt="image text" />
          </div>
          <div className="relative w-[104px] h-[23px]">
            <Image
              src="/images/icons/lumashape-text.svg"
              fill
              alt="image text"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;
