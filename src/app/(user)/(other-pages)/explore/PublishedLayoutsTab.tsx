"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, Download, Check, ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface UserInteraction {
    hasLiked: boolean;
    hasDisliked: boolean;
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
    likes?: number;
    dislikes?: number;
    downloads?: number;
    downloadedByUsers?: string[];
    canvas?: {
        width: number;
        height: number;
        unit: "mm" | "inches";
        thickness: number;
    };
    metadata?: {
        containerType?: string;
        layoutName?: string;
        selectedBrand?: string;
        width: number;
        length: number;
        units: string;
        thickness: number;
    };
    tools?: Array<{
        id: string;
        name: string;
        thickness?: number;
        toolBrand?: string;
        metadata?: {
            toolBrand?: string;
        };
    }>;
}

const PublishedLayoutsTab = () => {
    const [publishedLayouts, setPublishedLayouts] = useState<LayoutWithInteraction[]>([]);
    const [filteredLayouts, setFilteredLayouts] = useState<LayoutWithInteraction[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [addedLayouts, setAddedLayouts] = useState<Set<string>>(new Set());
    const router = useRouter();

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedContainerType, setSelectedContainerType] = useState("");

    // New filter states
    const [selectedThickness, setSelectedThickness] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [selectedLength, setSelectedLength] = useState("");
    const [selectedWidth, setSelectedWidth] = useState("");
    const [selectedToolType, setSelectedToolType] = useState("");
    const [selectedToolBrand, setSelectedToolBrand] = useState("");

    // Dynamic options for dropdowns
    const [availableToolTypes, setAvailableToolTypes] = useState<string[]>([]);
    const [availableToolBrands, setAvailableToolBrands] = useState<string[]>([]);

    const STATIC_TOOL_BRANDS = [
        'Bahco',
        'Bosch',
        'Brown & Sharpe',
        'Channellock',
        'Cornwell',
        'Craftsman',
        'DeWalt',
        'Fein',
        'Festool',
        'Gearwrench',
        'Grizzly',
        'Hilti',
        'Husky',
        'iGaging',
        'Irwin',
        'Jet',
        'Klein Tools',
        'Knipex',
        'Mac Tools',
        'Makita',
        'Matco',
        'Metabo',
        'Milwaukee',
        'Mitutoyo',
        'Porter-Cable',
        'Powermatic',
        'Proto',
        'Ridgid',
        'Ryobi',
        'SawStop',
        'Snap-on',
        'Stanley',
        'Starrett',
        'Tekton',
        'Wera',
        'Wiha'
    ];

    const STATIC_TOOL_TYPES = [
        'Allen Key / Hex Key',
        'Caliper',
        'Chisel',
        'Clamp',
        'Countersink',
        'Drill Bit',
        'End Mill',
        'File',
        'Hammer',
        'Indicator, Dial',
        'Indicator, Test',
        'Level',
        'Marker / Scribe',
        'Measuring Tape',
        'Micrometer, Inside',
        'Micrometer, Outside',
        'Micrometer, Depth',
        'Pliers, Adjustable',
        'Pliers, Needle Nose',
        'Pliers, Slip Joint',
        'Pliers, Wire Cutting',
        'Punch, Center',
        'Router Bit',
        'Saw, Hand',
        'Saw, Hole',
        'Screwdriver, Flat',
        'Screwdriver, Phillips',
        'Socket',
        'Square, Combination',
        'Square, Engineer',
        'Tap',
        'Torque Wrench',
        'Utility Knife',
        'Vise Grip / Locking Pliers',
        'Wrench, Adjustable',
        'Wrench, Box',
        'Wrench, Combination',
        'Wrench, Open End',
        'Wrench, Ratcheting',
        'Wrench',
        'Pliers'
    ];


    const { user } = useUser();

    const isSelfOwnedLayout = (l: LayoutWithInteraction) => {
        const email = user?.email?.toLowerCase().trim();
        return !!email && (
            l.userEmail?.toLowerCase().trim() === email ||
            l.createdBy?.email?.toLowerCase().trim() === email
        );
    };

    const startPurchaseFlow = async (itemId: string) => {
        try {
            const token = getAuthToken()
            if (!token) {
                router.push('/auth/login')
                return
            }
            const res = await fetch('/api/purchases/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ itemType: 'layout', itemId })
            })
            const data = await res.json()
            if (!res.ok || !data?.url) throw new Error(data?.error || 'Failed to initiate checkout')
            window.location.href = data.url
        } catch (err) {
            console.error('Start purchase error:', err)
            alert('Failed to start payment. Please try again.')
        }
    }

    useEffect(() => {
        fetchPublishedLayouts();
    }, []);

    useEffect(() => {
        applyFilters();
        extractDynamicOptions();
    }, [publishedLayouts, searchTerm, selectedBrand, selectedContainerType,
        selectedThickness, selectedUnit, selectedLength, selectedWidth,
        selectedToolType, selectedToolBrand]);

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

    const extractDynamicOptions = () => {
        const toolTypes = new Set<string>();
        const toolBrands = new Set<string>();
        const excludedTypes = new Set(["Circle", "Finger Cut", "Square"].map(t => t.toLowerCase()));

        publishedLayouts.forEach(layout => {
            layout.tools?.forEach(tool => {
                const typeName = tool.name?.trim();
                if (typeName && !excludedTypes.has(typeName.toLowerCase())) {
                    toolTypes.add(typeName);
                }

                const brandName = (tool.toolBrand ?? tool.metadata?.toolBrand)?.trim();
                if (brandName) {
                    toolBrands.add(brandName);
                }
            });
        });

        setAvailableToolTypes(Array.from(toolTypes).sort());
        setAvailableToolBrands(Array.from(toolBrands).sort());
    };

    // Conversion helper functions
    const convertToMm = (value: number, unit: string): number => {
        if (unit === "inches") {
            return value * 25.4; // 1 inch = 25.4 mm
        }
        return value;
    };

    const convertToInches = (value: number, unit: string): number => {
        if (unit === "mm") {
            return value / 25.4;
        }
        return value;
    };

    // Normalize layout values to selected unit for comparison
    const normalizeToSelectedUnit = (value: number, layoutUnit: string): number => {
        if (selectedUnit === "mm") {
            return convertToMm(value, layoutUnit);
        } else if (selectedUnit === "inches") {
            return convertToInches(value, layoutUnit);
        }
        return value;
    };

    // Get thickness options based on selected unit
    const getThicknessOptions = () => {
        return [
            { value: "1.25", label: "1.25" },
            // { value: "2.0", label: "2.0" },
            // { value: "2.5", label: "2.5" },
            // { value: "3.0", label: "3.0" },
        ];
    };

    const applyFilters = () => {
        let filtered = [...publishedLayouts];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(layout =>
                (layout.metadata?.layoutName || layout.name).toLowerCase().includes(term) ||
                (layout.metadata?.selectedBrand || layout.brand || '').toLowerCase().includes(term) ||
                (layout.metadata?.containerType || '').toLowerCase().includes(term) ||
                (layout.createdBy?.username || '').toLowerCase().includes(term) ||
                // Search within tools for dynamic brand/type
                (layout.tools?.some(tool =>
                    (tool.name || '').toLowerCase().includes(term) ||
                    ((tool.toolBrand || tool.metadata?.toolBrand || '')).toLowerCase().includes(term)
                ) ?? false)
            );
        }

        // Brand filter
        if (selectedBrand && selectedBrand !== "Container Brand") {
            filtered = filtered.filter(layout =>
                (layout.metadata?.selectedBrand || layout.brand) === selectedBrand
            );
        }

        // Container type filter
        if (selectedContainerType && selectedContainerType !== "Container Type") {
            filtered = filtered.filter(layout =>
                layout.metadata?.containerType === selectedContainerType
            );
        }

        // Unit filter - filter first, then apply unit-specific filters
        if (selectedUnit) {
            filtered = filtered.filter(layout =>
                (layout.canvas?.unit === selectedUnit || layout.metadata?.units === selectedUnit)
            );
        }

        // Thickness filter — independent of unit
        if (selectedThickness) {
            const targetThickness = parseFloat(selectedThickness);

            filtered = filtered.filter(layout => {
                const layoutThickness = layout.canvas?.thickness || layout.metadata?.thickness;
                const layoutUnit = layout.canvas?.unit || layout.metadata?.units;

                if (!layoutThickness) return false;

                // If selectedUnit exists, normalize to it
                let normalizedThickness = layoutThickness;
                if (selectedUnit && layoutUnit) {
                    normalizedThickness = normalizeToSelectedUnit(layoutThickness, layoutUnit);
                }

                return Math.abs(normalizedThickness - targetThickness) < 0.01;
            });
        }


        // Length filter - convert to selected unit for comparison
        if (selectedLength && parseFloat(selectedLength) > 0 && selectedUnit) {
            const targetLength = parseFloat(selectedLength);
            filtered = filtered.filter(layout => {
                const layoutLength = layout.canvas?.height || layout.metadata?.length;
                const layoutUnit = layout.canvas?.unit || layout.metadata?.units;
                if (!layoutLength || !layoutUnit) return false;

                const normalizedLength = normalizeToSelectedUnit(layoutLength, layoutUnit);
                return Math.abs(normalizedLength - targetLength) < 0.01;
            });
        }

        // Width filter - convert to selected unit for comparison
        if (selectedWidth && parseFloat(selectedWidth) > 0 && selectedUnit) {
            const targetWidth = parseFloat(selectedWidth);
            filtered = filtered.filter(layout => {
                const layoutWidth = layout.canvas?.width || layout.metadata?.width;
                const layoutUnit = layout.canvas?.unit || layout.metadata?.units;
                if (!layoutWidth || !layoutUnit) return false;

                const normalizedWidth = normalizeToSelectedUnit(layoutWidth, layoutUnit);
                return Math.abs(normalizedWidth - targetWidth) < 0.01;
            });
        }

        // Tool Type filter
        if (selectedToolType) {
            filtered = filtered.filter(layout =>
                layout.tools?.some(tool => tool.name === selectedToolType)
            );
        }

        // Tool Brand filter — match brands attached to tools in the layout (supports metadata fallback)
        if (selectedToolBrand) {
            filtered = filtered.filter(layout =>
                layout.tools?.some(tool =>
                    tool.toolBrand === selectedToolBrand ||
                    tool.metadata?.toolBrand === selectedToolBrand
                )
            );
        }

        setFilteredLayouts(filtered);
    };

    // Handle like/dislike interactions
    const handleInteraction = async (layoutId: string, action: 'like' | 'dislike') => {
        try {
            setActionLoading(`${action}-${layoutId}`);
            const token = getAuthToken();

            const res = await fetch("/api/layouts/interactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ layoutId, action })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${action} layout`);
            }

            const data = await res.json();

            setPublishedLayouts(prev => prev.map(layout =>
                layout._id === layoutId
                    ? {
                        ...layout,
                        likes: data.layout.likes,
                        dislikes: data.layout.dislikes,
                        userInteraction: data.userInteraction
                    }
                    : layout
            ));

            console.log(data.message);
        } catch (error) {
            console.error(`Error ${action}ing layout:`, error);
            alert(`Failed to ${action} layout. Please try again.`);
        } finally {
            setActionLoading(null);
        }
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
                            userInteraction: {
                                hasLiked: l.userInteraction?.hasLiked || false,
                                hasDisliked: l.userInteraction?.hasDisliked || false,
                                hasDownloaded: true
                            }
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
            if (isSelfOwnedLayout(layout)) {
                alert("You cannot add your own published layout to your workspace.");
                setOpenDropdown(null);
                return;
            }
            if (isLayoutDownloaded(layout)) {
                await addToWorkspace(layout);
            } else {
                await startPurchaseFlow(layout._id);
            }
        } else if (action === "Inspect") {
            router.push(`/inspect-layout/${layout._id}`);
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
        setSelectedThickness("");
        setSelectedUnit("");
        setSelectedLength("");
        setSelectedWidth("");
        setSelectedToolType("");
        setSelectedToolBrand("");
    };

    const hasActiveFilters = searchTerm || selectedBrand || selectedContainerType ||
        selectedThickness || selectedUnit || selectedLength || selectedWidth ||
        selectedToolType || selectedToolBrand;

    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || parseFloat(value) >= 0) {
            setSelectedLength(value);
        }
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || parseFloat(value) >= 0) {
            setSelectedWidth(value);
        }
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUnit(e.target.value);
        // thickness is independent of unit, do not reset it
    };


    return (
        <div>
            {/* Filter Section */}
            <div className="mb-6 space-y-4">
                {/* Search Bar Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative w-full sm:max-w-[350px]">
                        <img
                            src="images/icons/explore/search_icon.svg"
                            alt="search"
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                        />
                        <input
                            type="text"
                            placeholder="Search Keyword"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Thickness */}
                    <div className="relative">
                        <select
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none min-w-[120px]"
                            value={selectedThickness}
                            onChange={(e) => setSelectedThickness(e.target.value)}
                        >
                            <option value="">Thickness</option>
                            {getThicknessOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <img
                            src="/images/icons/explore/published_layouts/thickness.svg"
                            alt="thickness"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4"
                        />
                    </div>

                    {/* Unit + Length + Width */}
                    <div className="appearance-none relative flex items-center gap-1 py-1 pl-3 pr-3 border rounded-md text-gray-700 focus:outline-none min-w-[300px]">
                        {/* Unit */}
                        <div className="relative">
                            <select
                                className="appearance-none bg-transparent text-gray-700 font-medium pr-6 pl-1 py-1 outline-none"
                                value={selectedUnit}
                                onChange={handleUnitChange}
                            >
                                <option value="">Unit</option>
                                <option value="mm">mm</option>
                                <option value="inches">inches</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        </div>

                        <span className="h-5 w-px bg-gray-200" />

                        {/* Length */}
                        <div className="relative flex items-center gap-2">
                            <span className="text-gray-500 text-sm">L</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={selectedLength}
                                onChange={handleLengthChange}
                                min="0"
                                step={selectedUnit === "mm" ? "1" : "0.1"}
                                disabled={!selectedUnit}
                                className="bg-transparent border-none outline-none w-[40px] text-gray-800 disabled:text-gray-400"
                            />
                            <img
                                src="/images/icons/explore/published_layouts/length.svg"
                                alt="length"
                                className="w-5 h-5"
                            />
                        </div>

                        <span className="h-5 w-px bg-gray-200" />

                        {/* Width */}
                        <div className="relative flex items-center gap-2">
                            <span className="text-gray-500 text-sm">W</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={selectedWidth}
                                onChange={handleWidthChange}
                                min="0"
                                step={selectedUnit === "mm" ? "1" : "0.1"}
                                disabled={!selectedUnit}
                                className="bg-transparent border-none outline-none w-[40px] text-gray-800 disabled:text-gray-400"
                            />
                            <img
                                src="/images/icons/explore/published_layouts/width.svg"
                                alt="width"
                                className="w-5 h-5"
                            />
                        </div>
                    </div>

                    {/* Tool Type */}
                    <div className="relative">
                        <select
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none min-w-[180px]"
                            value={selectedToolType}
                            onChange={(e) => setSelectedToolType(e.target.value)}
                        >
                            <option value="">Contains Tool Type</option>
                            {STATIC_TOOL_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    </div>

                    {/* Tool Brand */}
                    <div className="relative">
                        <select
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none min-w-[180px]"
                            value={selectedToolBrand}
                            onChange={(e) => setSelectedToolBrand(e.target.value)}
                        >
                            <option value="">Contains Tool Brand</option>
                            {STATIC_TOOL_BRANDS.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || selectedToolType || selectedToolBrand || selectedLength || selectedWidth || selectedUnit || selectedThickness) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-3 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 focus:outline-none"
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
                <div className="w-full max-w-[1200px]">
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
                                                    disabled={actionLoading === layout._id || isSelfOwnedLayout(layout)}
                                                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {actionLoading === layout._id ? (
                                                        <div className="w-4 h-4 border-2 border-[#266ca8] border-t-transparent rounded-full animate-spin" />
                                                    ) : isSelfOwnedLayout(layout) ? (
                                                        <Check className="w-4 h-4 text-gray-400" />
                                                    ) : isLayoutDownloaded(layout) ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Image src="/images/icons/edit.svg" width={16} height={16} alt="add" />
                                                    )}
                                                    <span className={`text-sm font-medium ${isSelfOwnedLayout(layout) ? 'text-gray-400'
                                                        : isLayoutDownloaded(layout) ? 'text-green-500'
                                                            : 'text-[#266ca8]'
                                                        }`}>
                                                        {actionLoading === layout._id
                                                            ? "Adding..."
                                                            : isSelfOwnedLayout(layout)
                                                                ? "Owned by you"
                                                                : isLayoutDownloaded(layout)
                                                                    ? "Added to Workspace"
                                                                    : "Add to My Workspace"
                                                        }
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleMenuClick("Inspect", layout)}
                                                    className="hidden sm:flex w-full px-3 py-2 text-left items-center gap-2 hover:bg-gray-50"
                                                >
                                                    <Image
                                                        src="/images/icons/share.svg"
                                                        width={16}
                                                        height={16}
                                                        alt="inspect"
                                                    />
                                                    <span className="text-[#808080] text-sm font-medium">
                                                        Inspect Layout
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
                                            <div className="text-[12px] text-[#b3b3b3] font-medium leading-tight space-y-[2px]">
                                                <div className="flex justify-between">
                                                    <span>Length:</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {(layout.metadata?.length ?? layout.canvas?.height) ?? "-"}{" "}
                                                        {(layout.canvas?.unit ?? layout.metadata?.units) ?? ""}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span>Width:</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {(layout.metadata?.width ?? layout.canvas?.width) ?? "-"}{" "}
                                                        {(layout.canvas?.unit ?? layout.metadata?.units) ?? ""}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span>Thickness:</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {(layout.canvas?.thickness ?? layout.metadata?.thickness) ?? "-"}{" "}
                                                        {"inches"}
                                                    </span>
                                                </div>
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

                                        {/* Stats Row */}
                                        <div className="flex items-center justify-between">
                                            {/* Left Stats - Like/Dislike/Download */}
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleInteraction(layout._id, 'like')}
                                                    disabled={actionLoading === `like-${layout._id}`}
                                                    className={`flex items-center gap-1 hover:bg-gray-100 px-1 py-1 rounded transition-colors disabled:opacity-50 ${layout.userInteraction?.hasLiked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
                                                        }`}
                                                >
                                                    <ThumbsUp
                                                        className={`w-3 h-3 ${layout.userInteraction?.hasLiked ? 'fill-current text-blue-600' : ''
                                                            }`}
                                                    />
                                                    <span className="text-[11px]">
                                                        {layout.likes || 0}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleInteraction(layout._id, 'dislike')}
                                                    disabled={actionLoading === `dislike-${layout._id}`}
                                                    className={`flex items-center gap-1 hover:bg-gray-100 px-1 py-1 rounded transition-colors disabled:opacity-50 ${layout.userInteraction?.hasDisliked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
                                                        }`}
                                                >
                                                    <ThumbsDown
                                                        className={`w-3 h-3 ${layout.userInteraction?.hasDisliked ? 'fill-current text-blue-600' : ''
                                                            }`}
                                                    />
                                                    <span className="text-[11px]">
                                                        {layout.dislikes || 0}
                                                    </span>
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <Download className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[11px] text-[#b3b3b3]">
                                                        {layout.downloads || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Date */}
                                            <span className="text-[12px] text-[#b3b3b3]">
                                                {layout.publishedDate
                                                    ? new Date(layout.publishedDate).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : ""}
                                            </span>
                                        </div>
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