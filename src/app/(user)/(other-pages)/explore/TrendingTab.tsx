"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, ThumbsDown, ThumbsUp, Download } from "lucide-react";

interface UserInteraction {
    hasLiked: boolean;
    hasDisliked: boolean;
    hasDownloaded: boolean;
}

interface TrendingTool {
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
    trendingScore?: number; // Optional field for calculated trending score
}

const TrendingTab = () => {
    const [trendingTools, setTrendingTools] = useState<TrendingTool[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchTrendingTools();
    }, []);

    const getAuthToken = () => localStorage.getItem("auth-token") || "";

    const fetchTrendingTools = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user/tool/getTrendingTools", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            
            if (!res.ok) {
                // Fallback to regular published tools if trending endpoint doesn't exist
                const fallbackRes = await fetch("/api/user/tool/getPublishedTools", {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                });
                if (!fallbackRes.ok) throw new Error("Failed to fetch tools");
                const fallbackData = await fallbackRes.json();
                
                // Calculate trending score and get top 4
                const toolsWithScore = (fallbackData.tools || []).map((tool: TrendingTool) => ({
                    ...tool,
                    trendingScore: (tool.likes * 2) + tool.downloads - tool.dislikes
                }));
                
                const top4 = toolsWithScore
                    .sort((a: TrendingTool, b: TrendingTool) => (b.trendingScore || 0) - (a.trendingScore || 0))
                    .slice(0, 4);
                
                setTrendingTools(top4);
                return;
            }
            
            const data = await res.json();
            setTrendingTools(data.tools || []);
        } catch (err) {
            console.error("Error fetching trending tools:", err);
        } finally {
            setLoading(false);
        }
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

    // Handle add to inventory
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

    // Toggle 3-dots dropdown
    const toggleDropdown = (toolId: string) => {
        setOpenDropdown(openDropdown === toolId ? null : toolId);
    };

    // Handle dropdown menu actions
    const handleMenuClick = (action: string, tool: TrendingTool) => {
        if (action === "Add") {
            handleAddToInventory(tool);
        } else if (action === "Explore") {
            console.log("Explore related layouts for:", tool);
            // TODO: navigate to layouts page
        }
        setOpenDropdown(null); // close dropdown after action
    };

    // Filter tools based on search term
    const filteredTools = trendingTools.filter(tool => {
        if (!searchTerm.trim()) return true;
        
        const searchLower = searchTerm.toLowerCase().trim();
        return (
            tool.toolType.toLowerCase().includes(searchLower) ||
            tool.brand.toLowerCase().includes(searchLower) ||
            tool.paperType.toLowerCase().includes(searchLower) ||
            tool.createdBy?.username?.toLowerCase().includes(searchLower) ||
            tool.createdBy?.email?.toLowerCase().includes(searchLower)
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

            <p className="text-gray-700 text-base leading-relaxed mb-4">
                {`Check out what's popular right now based on upvotes and downloads. These layouts and tools are trusted and used by the community.`}
            </p>

            {/* Trending Tools Section */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Trending Tools</h2>
                
                {loading ? (
                    <p className="text-center text-gray-500">Loading trending tools...</p>
                ) : filteredTools.length === 0 ? (
                    <p className="text-center text-gray-500">
                        {searchTerm ? "No trending tools match your search." : "No trending tools available yet."}
                    </p>
                ) : (
                    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
                            {filteredTools.map((tool, index) => (
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
        </div>
    );
};

export default TrendingTab;