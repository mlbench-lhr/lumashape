'use client'
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ToolData {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    thickness: number;
    unit: 'mm' | 'inches';
    opacity?: number;
    smooth?: number;
    image?: string;
}

interface CanvasData {
    width: number;
    height: number;
    unit: 'mm' | 'inches';
    thickness: number;
}

interface LayoutStats {
    totalTools: number;
    validLayout: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    downloads?: number;
}

interface Layout {
    _id: string;
    name: string;
    brand?: string;
    canvas: CanvasData;
    tools: ToolData[];
    stats: LayoutStats;
    userEmail: string;
    snapshotUrl?: string;
    published?: boolean;
    publishedDate?: string | Date;
    downloads?: number;
}

const MyLayouts = () => {
    const router = useRouter();
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Fetch published layouts from API
    const fetchPublishedLayouts = async () => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem('auth-token');
            if (!authToken) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`/api/layouts`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch layouts');
            }

            // Filter only published layouts on frontend
            const publishedLayouts = data.data.filter((layout: Layout) => layout.published === true);
            setLayouts(publishedLayouts);
            setError(null);
        } catch (err) {
            console.error('Error fetching published layouts:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch published layouts');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchPublishedLayouts();
    }, []);

    // Toggle 3-dots dropdown (non-functional)
    const toggleDropdown = (layoutId: string) => {
        setOpenDropdown(openDropdown === layoutId ? null : layoutId);
    };

    // Handle dropdown menu actions (non-functional)
    const handleMenuClick = (action: string, layout: Layout) => {
        console.log(`${action} clicked for layout:`, layout);
        setOpenDropdown(null); // close dropdown after action
    };

    // Format canvas dimensions
    const formatDimensions = (canvas: CanvasData) => {
        return `(${canvas.width}" × ${canvas.height}")`;
    };

    // Format published date
    const formatPublishedDate = (date: string | Date | undefined) => {
        if (!date) return 'N/A';
        const publishedDate = new Date(date);
        return publishedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format downloads count
    const formatDownloads = (count: number | undefined) => {
        if (!count && count !== 0) return '0';
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    };

    return (
        <>
            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading published layouts...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && layouts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex flex-col justify-center items-center w-[204px] h-[204px] sm:w-[261px] sm:h-[261px] bg-[#e8e8e8] rounded-[150px] border-[#e8e8e8]">
                        <div className="relative w-[90px] h-[90px] sm:w-[140px] sm:h-[140px]">
                            <Image src="/images/icons/workspace/noLayouts.svg" fill style={{ objectFit: "contain" }} alt="no layouts" />
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium text-center mt-[19px]">
                        No Published Layouts Yet
                    </p>
                    <p className="text-gray-400 text-sm text-center mt-2">
                        Publish your layouts from the workspace to see them here
                    </p>
                </div>
            )}

            {/* Layouts Grid */}
            {!loading && layouts.length > 0 && (
                <div className="flex flex-wrap mt-4 justify-center sm:justify-start gap-4">
                    {layouts.map((layout) => (
                        <div
                            key={layout._id}
                            className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px] relative"
                        >
                            <div className="w-[258px] sm:w-[242px]">
                                <div className="relative w-full h-[150px]">
                                    {layout.snapshotUrl ? (
                                        <Image
                                            src={layout.snapshotUrl}
                                            alt={`${layout.name} layout`}
                                            fill
                                            style={{ objectFit: "contain", backgroundColor: "#f9f9f9" }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                            <div className="relative w-[80px] h-[80px]">
                                                <Image
                                                    src="/images/icons/workspace/noLayouts.svg"
                                                    fill
                                                    style={{ objectFit: "contain" }}
                                                    alt="layout"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Three Dots Button (non-functional) */}
                                    <button
                                        className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDropdown(layout._id);
                                        }}
                                    >
                                        <MoreVertical className="w-4 h-4 text-[#266ca8]" />
                                    </button>

                                    {/* Dropdown menu (non-functional) */}
                                    {openDropdown === layout._id && (
                                        <div
                                            className="absolute top-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-[220px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleMenuClick("Edit", layout)}
                                                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 cursor-not-allowed opacity-50"
                                            >
                                                <Image
                                                    src="/images/icons/edit.svg"
                                                    width={16}
                                                    height={16}
                                                    alt="edit"
                                                />
                                                <span className="text-[#266ca8] text-sm font-medium">
                                                    Edit Layout
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => handleMenuClick("Delete", layout)}
                                                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 cursor-not-allowed opacity-50"
                                            >
                                                <Image
                                                    src="/images/icons/share.svg"
                                                    width={16}
                                                    height={16}
                                                    alt="delete"
                                                />
                                                <span className="text-[#808080] text-sm font-medium">
                                                    Delete Layout
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Layout details */}
                            <div className="w-full flex flex-col px-2 py-2 space-y-1">
                                <div className="flex items-baseline gap-[3px]">
                                    <h3 className="font-bold text-[16px] truncate">{`${layout.name} (${layout.brand})`}</h3>
                                </div>

                                <p className="text-[12px] text-[#666666] font-medium truncate">
                                    {`Custom ${formatDimensions(layout.canvas)}`}
                                </p>

                                {/* Downloads and Published Date */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <Download className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] text-[#666666] font-medium">
                                            {formatDownloads(layout.downloads || layout.stats?.downloads)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-[#666666] font-medium">
                                        {formatPublishedDate(layout.publishedDate)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default MyLayouts;