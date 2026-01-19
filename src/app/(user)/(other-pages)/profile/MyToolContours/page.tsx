"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MoreVertical, ThumbsDown, ThumbsUp, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserInteraction {
    hasLiked: boolean;
    hasDisliked: boolean;
    hasDownloaded: boolean;
}

interface ToolWithInteraction {
    _id: string;
    toolType: string;
    toolBrand: string;
    SKUorPartNumber: string;
    imageUrl?: string;
    createdBy?: { username?: string; email?: string };
    likes: number;
    dislikes: number;
    downloads: number;
    published?: boolean;   // ✅ Add this
    publishedDate?: string;
    userInteraction?: UserInteraction;
}


const MyToolContours = () => {
    const router = useRouter();
    const [myTools, setMyTools] = useState<ToolWithInteraction[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        fetchMyPublishedTools();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;
            if (!target.closest('[data-dropdown]')) {
                setOpenDropdown(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getAuthToken = () => localStorage.getItem("auth-token") || "";

    const fetchMyPublishedTools = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user/tool/getAllTools", {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            if (!res.ok) throw new Error("Failed to fetch my tools");
            const data = await res.json();

            const publishedTools = (data.tools || []).filter(
                (tool: ToolWithInteraction) => tool.published === true
            );


            setMyTools(publishedTools);
        } catch (err) {
            console.error("Error fetching my tools:", err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle 3-dots dropdown
    const toggleDropdown = (toolId: string) => {
        setOpenDropdown(openDropdown === toolId ? null : toolId);
    };

    // Delete tool API
    const deleteTool = async (toolId: string) => {
        try {
            // Close dropdown immediately
            setOpenDropdown(null);

            const token = getAuthToken();
            if (!token) return;

            const res = await fetch(`/api/user/tool/deleteTools?toolId=${toolId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to delete tool");

            // Update tools state
            setMyTools(prev => prev.filter(tool => tool._id !== toolId));

        } catch (error) {
            console.error("Error deleting tool:", error);
        }
    };

    // Handle dropdown menu actions
    const handleMenuClick = async (action: string, tool: ToolWithInteraction) => {
        // Always close dropdown first
        setOpenDropdown(null);

        if (action === "Edit") {
            router.push(`/tools-inventory/edit/${tool._id}`);
        } else if (action === "Delete") {
            if (window.confirm("Are you sure you want to delete this tool?")) {
                deleteTool(tool._id);
            }
        }
    };

    return (
        <div className="mt-6">
            {/* My Published Tools Grid */}
            {loading ? (
                <p className="text-center text-gray-500">Loading your tools...</p>
            ) : myTools.length === 0 ? (
                <div className="text-center text-gray-500">
                    <p>{`You haven't published any tools yet.`}</p>
                </div>
            ) : (
                <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-0">
                    <div className="flex flex-wrap mt-4 justify-center sm:justify-start gap-4">
                        {myTools.map((tool) => (
                            <div
                                key={tool._id}
                                className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[280px] sm:w-[266px] sm:h-[270px] relative"
                            >
                                {/* Tool Image */}
                                <div className="w-[258px] sm:w-[242px]" data-dropdown>
                                    <div className="relative w-full h-[140px]">
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
                                                {/* <button
                                                    onClick={() => handleMenuClick("Edit", tool)}
                                                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                                >
                                                    <Image
                                                        src="/images/icons/edit.svg"
                                                        width={16}
                                                        height={16}
                                                        alt="edit"
                                                    />
                                                    <span className="text-[#266ca8] text-sm font-medium">
                                                        Edit Tool
                                                    </span>
                                                </button> */}
                                                <button
                                                    onClick={() => handleMenuClick("Delete", tool)}
                                                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                                >
                                                    <Image
                                                        src="/images/icons/delete.svg"
                                                        width={16}
                                                        height={16}
                                                        alt="delete"
                                                    />
                                                    <span className="text-[#ed2929] text-sm font-medium">
                                                        Delete Tool
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tool details */}
                                    <div className="w-full h-[102px] flex flex-col justify-center">
                                        <div className="space-y-1 mt-[20px] mb-[5px] text-[12px] text-[#666666] font-medium leading-tight">
                                            <div className="flex justify-between">
                                                <span>Tool Brand:</span>
                                                <span className="font-semibold text-gray-800">{tool.toolBrand || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Tool Type:</span>
                                                <span className="font-semibold text-gray-800">{tool.toolType || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>SKU or Part Number:</span>
                                                <span className="font-semibold text-gray-800">{tool.SKUorPartNumber || "-"}</span>
                                            </div>
                                        </div>

                                        {/* Stats Row (Read-only) */}
                                        <div className="flex items-center justify-between mt-1">
                                            {/* Left Stats */}
                                            <div className="flex items-center gap-1">
                                                <div
                                                    className={`flex items-center gap-1 px-1 py-1 rounded ${tool.userInteraction?.hasLiked ? 'text-blue-600' : 'text-gray-400'
                                                        }`}
                                                >
                                                    <ThumbsUp
                                                        className={`w-3 h-3 ${tool.userInteraction?.hasLiked ? 'fill-current text-blue-600' : ''
                                                            }`}
                                                    />
                                                    <span className="text-[11px]">
                                                        {tool.likes || 0}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1 px-1 py-1 rounded ${tool.userInteraction?.hasDisliked ? 'text-blue-600' : 'text-gray-400'
                                                        }`}
                                                >
                                                    <ThumbsDown
                                                        className={`w-3 h-3 ${tool.userInteraction?.hasDisliked ? 'fill-current text-blue-600' : ''
                                                            }`}
                                                    />
                                                    <span className="text-[11px]">
                                                        {tool.dislikes || 0}
                                                    </span>
                                                </div>
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

export default MyToolContours;