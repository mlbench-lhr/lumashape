'use client';
import React, { useState, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, RefreshCw, Search, ChevronDown, Info } from 'lucide-react';
import Image from 'next/image';
import {Tool } from './types';
// Types

// Sample tools data with PNG images


// Header Component
const Header: React.FC = () => {
    return (
        <div className="bg-white border-b border-gray-200 px-4 py-7 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Image
                    className="cursor-pointer"
                    onClick={() => window.history.back()}
                    src={"/images/icons/workspace/Back.svg"}
                    alt="Back"
                    width={35}
                    height={35}
                />
                <h1 className="ml-2 text-2xl font-bold text-gray-900">Design Your Tool Layout</h1>
            </div>
            <div className="flex items-center space-x-3">
                <button className="bg-primary text-white px-5 py-4 rounded-2xl text-sm font-medium">
                    Save & Exit
                </button>
                <button className="px-4 py-4 rounded-2xl bg-primary">
                    <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
};

export default Header;