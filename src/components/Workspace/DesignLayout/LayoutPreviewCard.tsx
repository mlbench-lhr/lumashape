import React, { useState } from "react";
import { MoreVertical, Wrench, Calendar, Edit, Upload, Trash2 } from "lucide-react";

interface ToolData {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    thickness: number;
    unit: "mm" | "inches";
    opacity?: number;
    smooth?: number;
    image?: string;
}

interface CanvasData {
    width: number;
    height: number;
    unit: "mm" | "inches";
    thickness: number;
}

interface LayoutStats {
    totalTools: number;
    validLayout: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}

interface Layout {
    _id: string;
    name: string;
    description?: string;
    canvas: CanvasData;
    tools: ToolData[];
    stats: LayoutStats;
    userEmail: string;
}

interface LayoutPreviewCardProps {
    layout: Layout;
    onEdit?: (layout: Layout) => void;
    onDuplicate?: (layout: Layout) => void;
    onDelete?: (layout: Layout) => void;
    onPublish?: (layout: Layout) => void;
}

const LayoutPreviewCard: React.FC<LayoutPreviewCardProps> = ({
    layout,
    onEdit,
    onDuplicate,
    onDelete,
    onPublish,
}) => {
    const [openMenu, setOpenMenu] = useState(false);

    // Preview scaling
    const previewWidth = 260;
    const previewHeight = 130; // reduced to fit top padding
    const padding = 10;
    const topPadding = 20; // NEW: top padding inside preview

    const scaleX = (previewWidth - padding * 2) / layout.canvas.width;
    const scaleY = (previewHeight - padding * 2) / layout.canvas.height;
    const scale = scaleX; // fill horizontally

    const scaledCanvasWidth = layout.canvas.width * scale;
    const scaledCanvasHeight = layout.canvas.height * scale;

    const offsetX = padding;
    const offsetY = (previewHeight - scaledCanvasHeight) / 2;

    const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const handleOptionClick = (action: string) => {
        setOpenMenu(false);
        switch (action) {
            case "edit":
                onEdit?.(layout);
                break;
            case "publish":
                onPublish?.(layout);
                break;
            case "delete":
                onDelete?.(layout);
                break;
        }
    };

    return (
        <div className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px] relative">
            {/* Preview Area with top padding */}
            <div
                className="relative w-full flex items-center justify-center bg-gray-50"
                style={{ height: `${150 + topPadding}px`, paddingTop: `${topPadding}px` }}
            >
                {/* Options Menu Button - top-right over canvas */}
                <div className="absolute top-2 right-2 z-20">
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="p-1 hover:bg-gray-100 rounded bg-white border border-gray-300 shadow-sm"
                    >
                        <MoreVertical className="w-4 h-4 text-blue-600" />
                    </button>

                    {openMenu && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(false)}
                            />
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[150px]">
                                <button
                                    onClick={() => handleOptionClick("edit")}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleOptionClick("publish")}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                                >
                                    <Upload className="w-4 h-4" /> Publish to profile
                                </button>
                                <button
                                    onClick={() => handleOptionClick("delete")}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* SVG Preview */}
                <svg
                    width={previewWidth}
                    height={previewHeight}
                    viewBox={`0 0 ${previewWidth} ${previewHeight}`}
                >
                    <rect
                        x={offsetX}
                        y={offsetY}
                        width={scaledCanvasWidth}
                        height={scaledCanvasHeight}
                        fill="white"
                        stroke="#d1d5db"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        rx="2"
                    />
                    {(() => {
                        if (layout.tools.length === 0) return null;

                        const availableWidth = scaledCanvasWidth * 0.8;
                        const availableHeight = scaledCanvasHeight * 0.8;

                        const toolCount = layout.tools.length;
                        let toolSize;
                        if (toolCount <= 2) toolSize = Math.min(availableWidth, availableHeight) * 0.4;
                        else if (toolCount <= 4) toolSize = Math.min(availableWidth, availableHeight) * 0.25;
                        else if (toolCount <= 6) toolSize = Math.min(availableWidth, availableHeight) * 0.18;
                        else toolSize = Math.min(availableWidth, availableHeight) * 0.12;

                        toolSize = Math.max(toolSize, 8);

                        const cols = Math.ceil(Math.sqrt(toolCount * (availableWidth / availableHeight)));
                        const rows = Math.ceil(toolCount / cols);

                        const spacingX = availableWidth / (cols + 1);
                        const spacingY = availableHeight / (rows + 1);

                        const startX = (previewWidth - availableWidth) / 2;
                        const startY = (previewHeight - availableHeight) / 2;

                        return layout.tools.map((tool, index) => {
                            const col = index % cols;
                            const row = Math.floor(index / cols);

                            const toolX = startX + spacingX * (col + 1) - toolSize / 2;
                            const toolY = startY + spacingY * (row + 1) - toolSize / 2;

                            return (
                                <g
                                    key={tool.id}
                                    transform={`translate(${toolX}, ${toolY}) rotate(${tool.rotation})`}
                                >
                                    {tool.image ? (
                                        <image
                                            href={tool.image}
                                            width={toolSize}
                                            height={toolSize}
                                            x={0}
                                            y={0}
                                            opacity={tool.opacity ? tool.opacity / 100 : 1}
                                        />
                                    ) : (
                                        <rect
                                            x={0}
                                            y={0}
                                            width={toolSize}
                                            height={toolSize}
                                            stroke="#266ca8"
                                            strokeWidth="1"
                                            fill="rgba(38, 108, 168, 0.1)"
                                            rx="2"
                                        />
                                    )}
                                </g>
                            );
                        });
                    })()}
                </svg>
            </div>

            {/* Layout details */}
            <div className="w-full px-3 py-2 flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                    <h3 className="font-bold text-[16px]">{layout.name}</h3>
                </div>
                <p className="text-[12px] text-[#b3b3b3] font-medium">
                    {layout.canvas.width} × {layout.canvas.height} {layout.canvas.unit}
                </p>
                <div className="flex items-center justify-between mt-2 text-[12px] text-gray-500">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        <span>{layout.stats.totalTools}</span>
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>{formatDate(layout.stats.updatedAt)}</span>
                    </div>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            layout.stats.validLayout
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {layout.stats.validLayout ? "Valid" : "Invalid"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LayoutPreviewCard;
