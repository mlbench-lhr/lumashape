"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, ThumbsDown, ThumbsUp, Download } from "lucide-react";

interface UserInteraction {
    hasLiked: boolean;
    hasDisliked: boolean;
    hasDownloaded: boolean;
}

interface ToolWithInteraction {
    _id: string;
    toolType: string;
    brand: string;
    paperType: string;
    annotatedImg?: string;
    backgroundImg?: string;
    createdBy?: { username?: string; email?: string };
    likes: number;
    dislikes: number;
    downloads: number;
    publishedDate?: string;
    userInteraction?: UserInteraction;
}

const PublishedToolsTab = () => {
    const [publishedTools, setPublishedTools] = useState<ToolWithInteraction[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedToolType, setSelectedToolType] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");

    useEffect(() => {
        fetchPublishedTools();
    }, []);

    const getAuthToken = () => localStorage.getItem("auth-token") || "";

    const fetchPublishedTools = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user/tool/getPublishedTools", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            if (!res.ok) throw new Error("Failed to fetch tools");
            const data = await res.json();
            setPublishedTools(data.tools || []);
        } catch (err) {
            console.error("Error fetching tools:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTools = publishedTools.filter((tool) => {
        const matchesSearch =
            tool.toolType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.paperType.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = selectedToolType ? tool.toolType === selectedToolType : true;
        const matchesBrand = selectedBrand ? tool.brand === selectedBrand : true;

        return matchesSearch && matchesType && matchesBrand;
    });

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedToolType("");
        setSelectedBrand("");
    };

    // Handle like/dislike actions
    const handleInteraction = async (toolId: string, action: 'like' | 'dislike') => {
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
            setPublishedTools(prev => prev.map(tool =>
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

    // Handle add to inventory
    const handleAddToInventory = async (tool: ToolWithInteraction) => {
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
            setPublishedTools(prev => prev.map(t =>
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

    // Toggle 3-dots dropdown
    const toggleDropdown = (toolId: string) => {
        setOpenDropdown(openDropdown === toolId ? null : toolId);
    };

    // Handle dropdown menu actions
    const handleMenuClick = (action: string, tool: ToolWithInteraction) => {
        if (action === "Add") {
            handleAddToInventory(tool);
        } else if (action === "Explore") {
            console.log("Explore related layouts for:", tool);
            // TODO: navigate to layouts page
        }
        setOpenDropdown(null); // close dropdown after action
    };

    return (
        <div>
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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
                        className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                {/* Dropdown Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <select
                            value={selectedToolType}
                            onChange={(e) => setSelectedToolType(e.target.value)}
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                        >
                            <option value="">Tool Type</option>
                            <option value="Custom">Custom</option>
                            <option value="Wrench">Wrench</option>
                            <option value="Pliers">Pliers</option>
                            <option value="Hammer">Hammer</option>
                        </select>
                        {/* Custom Arrow */}
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                            <svg
                                className="w-4 h-4 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                        >
                            <option value="">Tool Brand</option>
                            <option value="Bosch">Bosch</option>
                            <option value="Milwaukee">Milwaukee</option>
                            <option value="Makita">Makita</option>
                        </select>
                        {/* Custom Arrow */}
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                            <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(searchTerm || selectedToolType || selectedBrand) && (
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
                View individual tools shared by creators. Import contours into
                your tool inventory and reuse them in your own layouts.
            </p>

            {/* Published Tools Grid */}
            {loading ? (
                <p className="text-center text-gray-500">Loading tools...</p>
            ) : filteredTools.length === 0 ? (
                <div className="text-center text-gray-500">
                    {publishedTools.length === 0 ? (
                        <p>No published tools available yet.</p>
                    ) : (
                        <div>
                            <p>No tools match your current filters.</p>
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
                        {filteredTools.map((tool) => (
                            <div
                                key={tool._id}
                                className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[280px] sm:w-[266px] sm:h-[280px] relative"
                            >
                                {/* Tool Image */}
                                <div className="w-[258px] sm:w-[242px]">
                                    <div className="relative w-full h-[150px]">
                                        {tool.annotatedImg ? (
                                            <Image
                                                src={tool.annotatedImg}
                                                alt={`${tool.toolType} outlines`}
                                                fill
                                                style={{
                                                    objectFit: "contain",
                                                    backgroundColor: "#f9f9f9",
                                                }}
                                            />
                                        ) : tool.backgroundImg ? (
                                            <Image
                                                src={tool.backgroundImg}
                                                alt={tool.toolType}
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div className="relative w-[80px] h-[80px]">
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
                                                    onClick={() => handleMenuClick("Add", tool)}
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
                                                    onClick={() => handleMenuClick("Explore", tool)}
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
                                                ({tool.brand})
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-[#b3b3b3] font-medium">
                                            {tool.paperType}
                                        </p>
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
                                                    onClick={() => handleInteraction(tool._id, 'like')}
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
                                                    onClick={() => handleInteraction(tool._id, 'dislike')}
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
    );
};
export default PublishedToolsTab;