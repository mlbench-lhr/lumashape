"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, ThumbsDown, ThumbsUp, Download, Check } from "lucide-react";

interface UserInteraction {
    hasLiked: boolean;
    hasDisliked: boolean;
    hasDownloaded: boolean;
}

// Update the TrendingTool interface to match new schema
interface TrendingTool {
    _id: string;
    userEmail: string;
    toolBrand: string;
    toolType: string;
    length: number;
    depth: number;
    unit: string;
    imageUrl: string;
    userInteraction?: UserInteraction;
    processingStatus: "pending" | "completed" | "failed";
    cvResponse?: {
        success?: boolean;
        dxf_url?: string;
        annotated_image_url?: string;
        expanded_contour_image_url?: string;
        contour_points_count?: number;
        expansion_pixels?: number;
        dimensions?: {
            length_inches?: number;
            depth_inches?: number;
        };
        [key: string]: string | number | boolean | object | undefined;
    } | null;
    published: boolean;
    likes: number;
    dislikes: number;
    downloads: number;
    publishedDate?: string | null;
    trendingScore?: number;
    createdBy?: { username?: string; email?: string };
}

interface TrendingLayout {
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
    metadata?: {
        containerType?: string;
        layoutName?: string;
        selectedBrand?: string;
        width: number;
        length: number;
        units: string;
        thickness: number;
    };
}

const TrendingTab = () => {
    const [trendingTools, setTrendingTools] = useState<TrendingTool[]>([]);
    const [trendingLayouts, setTrendingLayouts] = useState<TrendingLayout[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [addedLayouts, setAddedLayouts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchTrendingContent();
    }, []);

    const getAuthToken = () => localStorage.getItem("auth-token") || "";

    const fetchTrendingContent = async () => {
        try {
            setLoading(true);

            // Fetch trending tools
            await fetchTrendingTools();

            // Fetch trending layouts
            await fetchTrendingLayouts();

        } catch (err) {
            console.error("Error fetching trending content:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingTools = async () => {
        try {
            const res = await fetch("/api/user/tool/getPublishedTools", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });

            if (!res.ok) throw new Error("Failed to fetch published tools");

            const data = await res.json();

            // Calculate trending score for each tool and get top 4
            const toolsWithScore = (data.tools || []).map((tool: TrendingTool) => ({
                ...tool,
                trendingScore: (tool.likes || 0) * 2 + (tool.downloads || 0) - (tool.dislikes || 0)
            }));

            // Sort by trending score (likes * 2 + downloads - dislikes) and get top 4
            const top4Tools = toolsWithScore
                .sort((a: TrendingTool, b: TrendingTool) => (b.trendingScore || 0) - (a.trendingScore || 0))
                .slice(0, 4);

            setTrendingTools(top4Tools);
        } catch (err) {
            console.error("Error fetching published tools:", err);
            setTrendingTools([]);
        }
    };

    const fetchTrendingLayouts = async () => {
        try {
            const res = await fetch("/api/layouts/getPublishedLayouts", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });

            if (!res.ok) throw new Error("Failed to fetch published layouts");

            const data = await res.json();

            // Sort by downloads and get top 4
            const top4Layouts = (data.layouts || [])
                .sort((a: TrendingLayout, b: TrendingLayout) => (b.downloads || 0) - (a.downloads || 0))
                .slice(0, 4);

            setTrendingLayouts(top4Layouts);
        } catch (err) {
            console.error("Error fetching published layouts:", err);
            setTrendingLayouts([]);
        }
    };

    // Handle like/dislike actions for tools
    const handleToolInteraction = async (toolId: string, action: 'like' | 'dislike') => {
        try {
            setActionLoading(`${action}-${toolId}`);
            const token = getAuthToken();

            const res = await fetch("/api/user/tool/interactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ toolId, action })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${action} tool`);
            }

            const data = await res.json();

            // Update local state to reflect the change
            setTrendingTools(prev => prev.map(tool =>
                tool._id === toolId
                    ? {
                        ...tool,
                        likes: data.tool.likes,
                        dislikes: data.tool.dislikes,
                        userInteraction: data.userInteraction
                    }
                    : tool
            ));

            console.log(data.message);
        } catch (error) {
            console.error(`Error ${action}ing tool:`, error);
            alert(`Failed to ${action} tool. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle like/dislike actions for layouts
    const handleLayoutInteraction = async (layoutId: string, action: 'like' | 'dislike') => {
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

            // Update local state to reflect the change
            setTrendingLayouts(prev => prev.map(layout =>
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

    // Handle add tool to inventory
    const handleAddToInventory = async (tool: TrendingTool) => {
        try {
            setActionLoading(`add-${tool._id}`);
            const token = getAuthToken();

            const res = await fetch("/api/user/tool/addToInventory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ toolId: tool._id })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add tool to inventory");
            }

            const data = await res.json();

            // Update download count in local state
            setTrendingTools(prev => prev.map(t =>
                t._id === tool._id
                    ? { ...t, downloads: (t.downloads || 0) + 1 }
                    : t
            ));

            alert("Tool added to your inventory successfully!");
            console.log("Tool added to inventory:", data);
        } catch (error) {
            console.error("Error adding tool to inventory:", error);
            alert(error instanceof Error ? error.message : "Failed to add tool to inventory");
        } finally {
            setActionLoading(null);
        }
    };

    // Handle add layout to workspace
    const handleAddLayoutToWorkspace = async (layout: TrendingLayout) => {
        try {
            setActionLoading(`layout-add-${layout._id}`);

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

            // Update the UI to reflect the successful addition
            setAddedLayouts(prev => new Set(prev).add(layout._id));

            // Update the downloads count in the local state
            setTrendingLayouts(prevLayouts =>
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

    // Toggle 3-dots dropdown
    const toggleDropdown = (id: string) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    // Handle dropdown menu actions for tools
    const handleToolMenuClick = (action: string, tool: TrendingTool) => {
        if (action === "Add") {
            handleAddToInventory(tool);
        } else if (action === "Explore") {
            console.log("Explore related layouts for:", tool);
        }
        setOpenDropdown(null);
    };

    // Handle dropdown menu actions for layouts
    const handleLayoutMenuClick = async (action: string, layout: TrendingLayout) => {
        if (action === "Add") {
            await handleAddLayoutToWorkspace(layout);
        } else if (action === "Explore") {
            console.log("Explore related tools for:", layout);
            setOpenDropdown(null);
        }
    };

    // Check if layout is already downloaded by current user
    const isLayoutDownloaded = (layout: TrendingLayout) => {
        return addedLayouts.has(layout._id) || layout.userInteraction?.hasDownloaded;
    };

    // Filter tools based on search term
    const filteredTools = trendingTools.filter(tool => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase().trim();
        return (
            tool.toolType.toLowerCase().includes(searchLower) ||
            tool.toolBrand.toLowerCase().includes(searchLower) ||
            tool.createdBy?.username?.toLowerCase().includes(searchLower) ||
            tool.createdBy?.email?.toLowerCase().includes(searchLower)
        );
    });

    // Filter layouts based on search term
    const filteredLayouts = trendingLayouts.filter(layout => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase().trim();
        return (
            layout.name.toLowerCase().includes(searchLower) ||
            layout.metadata?.layoutName?.toLowerCase().includes(searchLower) ||
            layout.metadata?.selectedBrand?.toLowerCase().includes(searchLower) ||
            layout.metadata?.containerType?.toLowerCase().includes(searchLower) ||
            layout.createdBy?.username?.toLowerCase().includes(searchLower) ||
            layout.createdBy?.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative w-full max-w-md">
                    <img
                        src="images/icons/explore/search_icon.svg"
                        alt="search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    />
                    <input
                        type="text"
                        placeholder="Search Keyword"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none"
                    />
                </div>
            </div>

            <p className="text-gray-700 text-base leading-relaxed mb-6">
                {`Check out what's popular right now based on upvotes and downloads. These layouts and tools are trusted and used by the community.`}
            </p>

            {/* Trending Tools Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Trending Tools</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Loading trending tools...</p>
                ) : filteredTools.length === 0 ? (
                    <p className="text-center text-gray-500">
                        {searchTerm ? "No trending tools match your search." : "No trending tools available yet."}
                    </p>
                ) : (
                    <div className="w-full max-w-[1200px]">
                        {/* Tools grid */}
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                            {filteredTools.map((tool) => (
                                <div
                                    key={tool._id}
                                    className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[240px] sm:w-[266px] sm:h-[280px] relative"
                                >
                                    {/* Tool Image */}
                                    <div className="w-[258px] sm:w-[242px]">
                                        <div className="relative w-full h-[150px]">
                                            {tool.imageUrl ? (
                                                <Image
                                                    src={tool.imageUrl}
                                                    alt={`${tool.toolType} outlines`}
                                                    fill
                                                    style={{
                                                        objectFit: "contain",
                                                        backgroundColor: "#f9f9f9",
                                                    }}
                                                />
                                            ) : (
                                                <div className="relative w-[80px] h-[80px] mx-auto mt-8">
                                                    <Image
                                                        src="/images/icons/wrench.svg"
                                                        fill
                                                        style={{ objectFit: "contain" }}
                                                        alt="tool"
                                                    />
                                                </div>
                                            )}

                                            {/* Three Dots Button */}
                                            <button
                                                className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleDropdown(tool._id);
                                                }}
                                            >
                                                <MoreVertical className="w-4 h-4 text-[#266ca8]" />
                                            </button>

                                            {/* Dropdown menu */}
                                            {openDropdown === tool._id && (
                                                <div
                                                    className="absolute top-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-[220px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => handleToolMenuClick("Add", tool)}
                                                        disabled={actionLoading === `add-${tool._id}`}
                                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        <Image
                                                            src="/images/icons/edit.svg"
                                                            width={16}
                                                            height={16}
                                                            alt="add"
                                                        />
                                                        <span className="text-[#266ca8] text-sm font-medium">
                                                            {actionLoading === `add-${tool._id}` ? "Adding..." : "Add to My Tool Inventory"}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToolMenuClick("Explore", tool)}
                                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                                    >
                                                        <Image
                                                            src="/images/icons/share.svg"
                                                            width={16}
                                                            height={16}
                                                            alt="explore"
                                                        />
                                                        <span className="text-[#808080] text-sm font-medium">
                                                            Explore Related Layouts
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tool details */}
                                        <div className="w-full h-[102px] flex flex-col justify-center">
                                            <div className="flex items-baseline gap-[3px]">
                                                <h3 className="font-bold text-[16px]">
                                                    {tool.toolType}
                                                </h3>
                                                <span className="text-[14px] font-medium">
                                                    ({tool.toolBrand})
                                                </span>
                                            </div>
                                            {tool.createdBy && (
                                                <p className="text-[12px] text-[#b3b3b3] font-medium mt-1 flex items-center gap-2">
                                                    <span className="w-5 h-5 flex items-center justify-center bg-primary rounded-full text-[10px] text-white">
                                                        {tool.createdBy?.username?.charAt(0).toUpperCase() || "U"}
                                                    </span>
                                                    <span>
                                                        {tool.createdBy?.username || tool.createdBy?.email || "anonymous"}
                                                    </span>
                                                </p>
                                            )}

                                            {/* Stats Row */}
                                            <div className="flex items-center justify-between mt-2">
                                                {/* Left Stats */}
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleToolInteraction(tool._id, 'like')}
                                                        disabled={actionLoading === `like-${tool._id}`}
                                                        className={`flex items-center gap-1 hover:bg-gray-100 px-1 py-1 rounded transition-colors disabled:opacity-50 ${tool.userInteraction?.hasLiked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
                                                            }`}
                                                    >
                                                        <ThumbsUp
                                                            className={`w-3 h-3 ${tool.userInteraction?.hasLiked ? 'fill-current text-blue-600' : ''
                                                                }`}
                                                        />
                                                        <span className="text-[11px]">
                                                            {tool.likes || 0}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToolInteraction(tool._id, 'dislike')}
                                                        disabled={actionLoading === `dislike-${tool._id}`}
                                                        className={`flex items-center gap-1 hover:bg-gray-100 px-1 py-1 rounded transition-colors disabled:opacity-50 ${tool.userInteraction?.hasDisliked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
                                                            }`}
                                                    >
                                                        <ThumbsDown
                                                            className={`w-3 h-3 ${tool.userInteraction?.hasDisliked ? 'fill-current text-blue-600' : ''
                                                                }`}
                                                        />
                                                        <span className="text-[11px]">
                                                            {tool.dislikes || 0}
                                                        </span>
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <Download className="w-3 h-3 text-gray-400" />
                                                        <span className="text-[11px] text-[#b3b3b3]">
                                                            {tool.downloads || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Date */}
                                                <span className="text-[12px] text-[#b3b3b3]">
                                                    {tool.publishedDate
                                                        ? new Date(tool.publishedDate).toLocaleDateString("en-US", {
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

            {/* Trending Layouts Section */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Trending Layouts</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Loading trending layouts...</p>
                ) : filteredLayouts.length === 0 ? (
                    <p className="text-center text-gray-500">
                        {searchTerm ? "No trending layouts match your search." : "No trending layouts available yet."}
                    </p>
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
                                                <div className="relative w-[80px] h-[80px] mx-auto mt-8">
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
                                                    toggleDropdown(`layout-${layout._id}`);
                                                }}
                                                disabled={actionLoading === `layout-${layout._id}`}
                                            >
                                                <MoreVertical className="w-4 h-4 text-[#266ca8]" />
                                            </button>

                                            {/* Dropdown menu */}
                                            {openDropdown === `layout-${layout._id}` && (
                                                <div
                                                    className="absolute top-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-[220px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => handleLayoutMenuClick("Add", layout)}
                                                        disabled={actionLoading === `layout-add-${layout._id}`}
                                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionLoading === `layout-add-${layout._id}` ? (
                                                            <div className="w-4 h-4 border-2 border-[#266ca8] border-t-transparent rounded-full animate-spin" />
                                                        ) : isLayoutDownloaded(layout) ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <Image
                                                                src="/images/icons/add.svg"
                                                                width={16}
                                                                height={16}
                                                                alt="add"
                                                            />
                                                        )}
                                                        <span className="text-[#808080] text-sm font-medium">
                                                            {isLayoutDownloaded(layout) ? "Added to My Workspace" : "Add to My Workspace"}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleLayoutMenuClick("Explore", layout)}
                                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                                    >
                                                        <Image
                                                            src="/images/icons/explore.svg"
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
                                                    {`Custom (${layout.metadata?.width}" × ${layout.metadata?.length}" × ${layout.metadata?.thickness}" ) ${layout.metadata?.units}`}
                                                </p>
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

                                            {/* Stats Row - Like/Dislike/Download */}
                                            <div className="flex items-center justify-between mt-2">
                                                {/* Left Stats - Like/Dislike/Download */}
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleLayoutInteraction(layout._id, 'like')}
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
                                                        onClick={() => handleLayoutInteraction(layout._id, 'dislike')}
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
        </div>
    );
};

export default TrendingTab;