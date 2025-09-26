"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, Download, Check } from "lucide-react";

interface UserInteraction {
    hasDownloaded: boolean;
}

interface LayoutWithInteraction {
    _id: string;
    name: string;
    brand?: string;
    userEmail: string;
    snapshotUrl?: string;
    published?: boolean;
    createdBy?: { username?: string; email?: string };
    publishedDate?: string;
    userInteraction?: UserInteraction;
    downloads?: number;
    downloadedByUsers?: string[];
    metadata?: {
        containerType?: string;
        layoutName?: string;
        selectedBrand?: string;
        width: number;
        length: number;
        units: string;
    };
}

const PublishedLayoutsTab = () => {
    const [publishedLayouts, setPublishedLayouts] = useState<LayoutWithInteraction[]>([]);
    const [filteredLayouts, setFilteredLayouts] = useState<LayoutWithInteraction[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [addedLayouts, setAddedLayouts] = useState<Set<string>>(new Set());
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedContainerType, setSelectedContainerType] = useState("");

    useEffect(() => {
        fetchPublishedLayouts();
    }, []);

    // Apply filters whenever search term or filters change
    useEffect(() => {
        applyFilters();
    }, [publishedLayouts, searchTerm, selectedBrand, selectedContainerType]);

    const getAuthToken = () => localStorage.getItem("auth-token") || "";

    const fetchPublishedLayouts = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/layouts/getPublishedLayouts", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            if (!res.ok) throw new Error("Failed to fetch layouts");
            const data = await res.json();
            setPublishedLayouts(data.layouts || []);
        } catch (err) {
            console.error("Error fetching layouts:", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...publishedLayouts];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(layout => 
                (layout.metadata?.layoutName || layout.name).toLowerCase().includes(term) ||
                (layout.metadata?.selectedBrand || layout.brand || '').toLowerCase().includes(term) ||
                (layout.metadata?.containerType || '').toLowerCase().includes(term) ||
                (layout.createdBy?.username || '').toLowerCase().includes(term)
            );
        }

        // Apply brand filter
        if (selectedBrand && selectedBrand !== "Container Brand") {
            filtered = filtered.filter(layout => 
                (layout.metadata?.selectedBrand || layout.brand) === selectedBrand
            );
        }

        // Apply container type filter
        if (selectedContainerType && selectedContainerType !== "Container Type") {
            filtered = filtered.filter(layout => 
                layout.metadata?.containerType === selectedContainerType
            );
        }

        setFilteredLayouts(filtered);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBrand(e.target.value);
    };

    const handleContainerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedContainerType(e.target.value);
    };

    const addToWorkspace = async (layout: LayoutWithInteraction) => {
        try {
            setActionLoading(layout._id);
            
            const res = await fetch("/api/layouts/addToWorkspace", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({ layoutId: layout._id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    alert("This layout already exists in your workspace!");
                } else {
                    throw new Error(data.error || "Failed to add layout to workspace");
                }
                return;
            }

            setAddedLayouts(prev => new Set(prev).add(layout._id));
            
            setPublishedLayouts(prevLayouts => 
                prevLayouts.map(l => 
                    l._id === layout._id 
                        ? { 
                            ...l, 
                            downloads: (l.downloads || 0) + 1,
                            userInteraction: { ...l.userInteraction, hasDownloaded: true }
                          }
                        : l
                )
            );

            alert("Layout added to your workspace successfully!");
            
        } catch (err) {
            console.error("Error adding layout to workspace:", err);
            alert("Failed to add layout to workspace. Please try again.");
        } finally {
            setActionLoading(null);
            setOpenDropdown(null);
        }
    };

    const toggleDropdown = (layoutId: string) => {
        setOpenDropdown(openDropdown === layoutId ? null : layoutId);
    };

    const handleMenuClick = async (action: string, layout: LayoutWithInteraction) => {
        if (action === "Add") {
            await addToWorkspace(layout);
        } else if (action === "Explore") {
            console.log("Explore related tools for:", layout);
            setOpenDropdown(null);
        }
    };

    const isLayoutDownloaded = (layout: LayoutWithInteraction) => {
        return addedLayouts.has(layout._id) || layout.userInteraction?.hasDownloaded;
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedBrand("");
        setSelectedContainerType("");
    };

    return (
        <div>
            {/* Top Row: Search + Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative w-full max-w-md">
                    <img
                        src="images/icons/explore/search_icon.svg"
                        alt="search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                    />
                    <input
                        type="text"
                        placeholder="Search Keyword"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <select 
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                            value={selectedBrand}
                            onChange={handleBrandChange}
                        >
                            <option value="">Container Brand</option>
                            <option value="BOSCH">BOSCH</option>
                            <option value="Milwaukee">Milwaukee</option>
                            <option value="Makita">Makita</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                            <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select 
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                            value={selectedContainerType}
                            onChange={handleContainerTypeChange}
                        >
                            <option value="">Container Type</option>
                            <option value="Drawer">Drawer</option>
                            <option value="Box">Box</option>
                            <option value="Case">Case</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                            <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(searchTerm || selectedBrand || selectedContainerType) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 focus:outline-none"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-700 text-base leading-relaxed mb-4">
                Browse community-made layouts with ready-to-cut designs. Save them to your
                workspace and customize as needed.
            </p>

            {/* Results count */}
            {!loading && (
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredLayouts.length} of {publishedLayouts.length} layouts
                    {(searchTerm || selectedBrand || selectedContainerType) && (
                        <span className="ml-2 text-blue-600">
                            (filtered)
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <p className="text-center text-gray-500">Loading layouts...</p>
            ) : filteredLayouts.length === 0 ? (
                <div className="text-center text-gray-500">
                    {publishedLayouts.length === 0 ? (
                        <p>No published layouts available yet.</p>
                    ) : (
                        <div>
                            <p>No layouts match your current filters.</p>
                            <button
                                onClick={clearFilters}
                                className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-0">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                        {filteredLayouts.map((layout) => (
                            <div
                                key={layout._id}
                                className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[300px] sm:w-[266px] sm:h-[300px] relative"
                            >
                                {/* Layout Image */}
                                <div className="w-[258px] sm:w-[242px]">
                                    <div className="relative w-full h-[150px]">
                                        {layout.snapshotUrl ? (
                                            <Image
                                                src={layout.snapshotUrl}
                                                alt={`${layout.snapshotUrl} layout`}
                                                fill
                                                style={{
                                                    objectFit: "contain",
                                                    backgroundColor: "#f9f9f9",
                                                }}
                                            />
                                        ) : (
                                            <div className="relative w-[80px] h-[80px]">
                                                <Image
                                                    src="/images/icons/layout.svg"
                                                    fill
                                                    style={{ objectFit: "contain" }}
                                                    alt="layout"
                                                />
                                            </div>
                                        )}

                                        {/* Three Dots Button */}
                                        <button
                                            className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDropdown(layout._id);
                                            }}
                                            disabled={actionLoading === layout._id}
                                        >
                                            <MoreVertical className="w-4 h-4 text-[#266ca8]" />
                                        </button>

                                        {/* Dropdown menu */}
                                        {openDropdown === layout._id && (
                                            <div
                                                className="absolute top-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-[220px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => handleMenuClick("Add", layout)}
                                                    disabled={actionLoading === layout._id}
                                                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {actionLoading === layout._id ? (
                                                        <div className="w-4 h-4 border-2 border-[#266ca8] border-t-transparent rounded-full animate-spin" />
                                                    ) : isLayoutDownloaded(layout) ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Image
                                                            src="/images/icons/edit.svg"
                                                            width={16}
                                                            height={16}
                                                            alt="add"
                                                        />
                                                    )}
                                                    <span className={`text-sm font-medium ${
                                                        isLayoutDownloaded(layout) 
                                                            ? 'text-green-500' 
                                                            : 'text-[#266ca8]'
                                                    }`}>
                                                        {actionLoading === layout._id 
                                                            ? "Adding..." 
                                                            : isLayoutDownloaded(layout)
                                                                ? "Added to Workspace"
                                                                : "Add to My Workspace"
                                                        }
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleMenuClick("Explore", layout)}
                                                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                                >
                                                    <Image
                                                        src="/images/icons/share.svg"
                                                        width={16}
                                                        height={16}
                                                        alt="explore"
                                                    />
                                                    <span className="text-[#808080] text-sm font-medium">
                                                        Explore Related Tools
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Layout details */}
                                    <div className="w-full h-[120px] flex flex-col justify-between p-2">
                                        <div className="space-y-1">
                                            {/* Layout Name */}
                                            <h3 className="font-bold text-[16px] leading-tight">
                                                {layout.metadata?.layoutName || layout.name}
                                            </h3>

                                            {/* Dimensions */}
                                            <p className="text-[12px] text-[#b3b3b3] font-medium">
                                                {`Custom (${layout.metadata?.width}" × ${layout.metadata?.length}")`}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            {/* Brand (right aligned) */}
                                            <div className="flex justify-between mt-2 text-[12px] font-medium">
                                                <span className="text-[#808080]">Brand:</span>
                                                <span>{layout.metadata?.selectedBrand || layout.brand}</span>
                                            </div>

                                            {/* Container Type (right aligned) */}
                                            <div className="flex justify-between text-[12px] font-medium">
                                                <span className="text-[#808080]">Container Type:</span>
                                                <span>{layout.metadata?.containerType}</span>
                                            </div>
                                        </div>

                                        {/* Created By */}
                                        {layout.createdBy && (
                                            <div className="text-[12px] font-medium mt-2 flex items-center gap-2">
                                                <span className="w-4 h-4 flex items-center justify-center bg-primary rounded-full text-[8px] text-white">
                                                    {layout.createdBy?.username?.charAt(0).toUpperCase() || "U"}
                                                </span>
                                                <span>
                                                    {layout.createdBy?.username ||
                                                        layout.createdBy?.email ||
                                                        "anonymous"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublishedLayoutsTab;