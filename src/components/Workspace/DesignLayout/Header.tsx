'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, RefreshCw, Save, AlertTriangle, CheckCircle, Download, FileText, Image as ImageIcon, File, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { DroppedTool } from './types';
import { Client } from '@gradio/client';
import * as htmlToImage from "html-to-image";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";

interface HeaderProps {
    droppedTools: DroppedTool[];
    canvasWidth: number;
    canvasHeight: number;
    thickness: number;
    unit: 'mm' | 'inches';
    hasOverlaps: boolean;
    onSaveLayout?: () => void;
}

interface LayoutFormData {
    layoutName?: string;
    selectedBrand?: string;
    containerType?: string;
    width?: number;
    length?: number;
    units?: 'mm' | 'inches';
    canvasWidth?: number;
    canvasHeight?: number;
    thickness?: number;
}

// Gradio API response types
type GradioLayoutResponse = {
    success: boolean;
    dxf_download_link?: string;
    error?: string;
};

// conversion helper
const mmToInches = (mm: number) => mm / 25.4;

const Header: React.FC<HeaderProps> = ({
    droppedTools,
    canvasWidth,
    canvasHeight,
    thickness,
    unit,
    hasOverlaps,
    onSaveLayout
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDxfGenerating, setIsDxfGenerating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { addToCart } = useCart();

    const handleAddToCart = async () => {
        if (hasOverlaps) {
            setSaveError("Cannot add layout with overlapping tools to cart. Please fix overlaps first.");
            return;
        }
        if (droppedTools.length === 0) {
            setSaveError("Cannot add empty layout to cart. Please add at least one tool.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            const authToken = getAuthToken();
            if (!authToken) throw new Error("Authentication required. Please log in again.");

            let additionalData: LayoutFormData = {};
            const sessionData = sessionStorage.getItem("layoutForm");
            if (sessionData) {
                try {
                    additionalData = JSON.parse(sessionData) as LayoutFormData;
                } catch (error) {
                    console.error("Error parsing session data:", error);
                }
            }

            // Capture and upload image
            let imageUrl: string | null = null;
            try {
                const canvasBlob = await captureCanvasImage();
                imageUrl = await uploadToDigitalOcean(canvasBlob);
            } catch (imageError) {
                console.warn("Failed to capture/upload image:", imageError);
            }

            // Create cart item with complete layout data
            const layoutName = additionalData.layoutName || `Layout ${new Date().toLocaleDateString()}`;
            const brandName = additionalData.selectedBrand || "";
            const containerSize = `${additionalData.canvasWidth ?? canvasWidth}" × ${additionalData.canvasHeight ?? canvasHeight}"`;

            // Prepare layout data to save with cart item
            const layoutData = {
                canvas: {
                    width: additionalData.canvasWidth ?? canvasWidth,
                    height: additionalData.canvasHeight ?? canvasHeight,
                    unit: unit,
                    thickness: thickness,
                },
                tools: droppedTools.map(tool => ({
                    id: tool.id,
                    name: tool.name,
                    x: tool.x,
                    y: tool.y,
                    rotation: tool.rotation,
                    flipHorizontal: tool.flipHorizontal,
                    flipVertical: tool.flipVertical,
                    thickness: tool.thickness,
                    unit: tool.unit,
                    opacity: tool.opacity,
                    smooth: tool.smooth,
                    image: tool.image,
                    groupId: tool.groupId || null,
                })),
            };

            // Add to cart with layout data
            await addToCart({
                id: `layout-${Date.now()}`,
                name: layoutName,
                brand: brandName,
                containerSize: containerSize,
                price: 30, // Fixed price as shown in the image
                snapshotUrl: imageUrl || undefined,
                layoutData: {
                    ...layoutData,
                    tools: layoutData.tools.map(tool => ({
                        ...tool,
                        image: tool.image ?? '', // ensure image is always a string
                        groupId: tool.groupId ?? undefined, // convert null to undefined
                    }))
                }, // Include complete layout data
            });

            toast.success("Layout added to cart successfully!");
        } catch (error) {
            console.error("Error adding to cart:", error);
            setSaveError(error instanceof Error ? error.message : "Failed to add layout to cart");
        } finally {
            setIsSaving(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Helper function to get auth token from localStorage
    const getAuthToken = (): string | null => {
        try {
            return localStorage.getItem('auth-token');
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
        }
    };

    // Helper function to convert pixel position to inches
    const convertPositionToInches = (pixelPosition: number, canvasDimension: number): number => {
        const canvasInInches = unit === 'mm' ? mmToInches(canvasDimension) : canvasDimension;

        // Get the actual canvas element to determine the pixel-to-inch ratio
        const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLDivElement;
        if (canvasElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            const pixelsPerInch = canvasRect.width / canvasInInches;
            return pixelPosition / pixelsPerInch;
        }

        // Fallback calculation if canvas element not found
        return pixelPosition / 96;
    };

    // Fetch tool DXF file as blob
    const fetchToolDxfBlob = async (toolId: string, authToken: string): Promise<Blob> => {
        const toolRes = await fetch(`/api/user/tool/getTool?toolId=${toolId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!toolRes.ok) {
            throw new Error(`Failed to fetch tool data for ID: ${toolId}`);
        }

        const { tool } = await toolRes.json();

        if (!tool?.dxfLink) {
            throw new Error(`Tool ${toolId} has no DXF link`);
        }

        // Fetch DXF file from S3
        const dxfRes = await fetch(tool.dxfLink);
        if (!dxfRes.ok) {
            throw new Error(`Failed to download DXF from ${tool.dxfLink}`);
        }

        return await dxfRes.blob();
    };

    // Generate DXF file using Gradio
    const generateDxfFile = async () => {
        if (droppedTools.length === 0) {
            setSaveError("Cannot generate DXF with no tools. Please add at least one tool.");
            return;
        }

        setIsDxfGenerating(true);
        setSaveError(null);

        try {
            // Get metadata
            let layoutName = "Tool Layout";
            let brand = "";
            const sessionData = sessionStorage.getItem("layoutForm");
            if (sessionData) {
                try {
                    const layoutForm = JSON.parse(sessionData) as LayoutFormData;
                    layoutName = layoutForm.layoutName || "Tool Layout";
                    brand = layoutForm.selectedBrand || "";
                } catch (err) {
                    console.error("Error parsing session data:", err);
                }
            }

            // Convert canvas dimensions to inches
            const canvasWidthInches = unit === "mm" ? mmToInches(canvasWidth) : canvasWidth;
            const canvasHeightInches = unit === "mm" ? mmToInches(canvasHeight) : canvasHeight;
            const canvasThicknessInches = unit === "mm" ? mmToInches(thickness) : thickness;

            const authToken = localStorage.getItem("auth-token");
            if (!authToken) throw new Error("Missing auth token");

            // Prepare tool data and fetch DXF blobs
            const toolData = [];
            const dxfBlobs = [];

            for (const droppedTool of droppedTools) {
                // Get the original tool ID
                const toolIdToFetch = droppedTool.metadata?.originalId || droppedTool.id.split('-').slice(0, -1).join('-');

                // Convert positions to inches
                const xInches = convertPositionToInches(droppedTool.x, canvasWidth);
                const yInches = convertPositionToInches(droppedTool.y, canvasHeight);

                console.log(`Processing tool: ${droppedTool.name}, Original ID: ${toolIdToFetch}, Position: (${xInches}, ${yInches})`);

                // Prepare tool information
                toolData.push({
                    name: droppedTool.name,
                    x: xInches,
                    y: yInches,
                    rotation: droppedTool.rotation || 0,
                });

                // Fetch DXF blob
                const dxfBlob = await fetchToolDxfBlob(toolIdToFetch, authToken);
                dxfBlobs.push(dxfBlob);
            }

            // Connect to Gradio client
            const client = await Client.connect("lumashape/generate_industrial_layout");

            // Prepare inputs for Gradio API
            const inputs = [
                canvasWidthInches,      // canvas_width
                canvasHeightInches,     // canvas_height  
                canvasThicknessInches,  // canvas_thickness
                layoutName,             // layout_name
                brand,                  // brand
                dxfBlobs,              // dxf_files array
                toolData.map(t => t.name),     // tool_names array
                toolData.map(t => t.x),        // tool_x_positions array
                toolData.map(t => t.y),        // tool_y_positions array
                toolData.map(t => t.rotation), // tool_rotations array
            ];

            console.log("Sending to Gradio:", {
                canvas: { width: canvasWidthInches, height: canvasHeightInches, thickness: canvasThicknessInches },
                layout: { name: layoutName, brand },
                toolCount: toolData.length
            });

            // Call Gradio API endpoint
            const response = await client.predict("/generate_industrial_layout", inputs);
            console.log("Gradio Response:", response);

            if (!response?.data) {
                throw new Error("Invalid response from Gradio API");
            }

            // Handle the response - Gradio typically returns file URLs
            let downloadUrl: string;

            if (Array.isArray(response.data)) {
                // If response is an array, find the download URL
                const fileResult = response.data.find(item =>
                    typeof item === 'string' && (item.includes('.dxf') || item.includes('download'))
                );

                if (!fileResult) {
                    throw new Error("No DXF download URL found in response");
                }

                downloadUrl = fileResult;
            } else if (typeof response.data === 'string') {
                downloadUrl = response.data;
            } else {
                throw new Error("Unexpected response format from Gradio API");
            }

            // Download the file
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `${layoutName.replace(/\s+/g, "_")}-layout-${timestamp}.dxf`;

            // Create download link
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            link.target = "_blank"; // Open in new tab as fallback
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setShowDropdown(false);
            console.log("DXF file downloaded successfully");

        } catch (err) {
            console.error("Error generating DXF:", err);
            setSaveError(err instanceof Error ? err.message : "Failed to generate DXF file");
        } finally {
            setIsDxfGenerating(false);
        }
    };

    // Generate comprehensive text file data (always in inches + diagonal height + position in inches)
    const generateTextFileData = (): string => {
        const timestamp = new Date().toISOString();

        let content = `Tool Layout Export\n`;
        content += `Generated: ${timestamp}\n`;
        content += `${'='.repeat(50)}\n\n`;

        // Canvas Information
        content += `CANVAS INFORMATION\n`;
        content += `${'-'.repeat(20)}\n`;
        content += `Width: ${unit === 'mm' ? mmToInches(canvasWidth).toFixed(2) : canvasWidth} inches\n`;
        content += `Height: ${unit === 'mm' ? mmToInches(canvasHeight).toFixed(2) : canvasHeight} inches\n`;
        content += `Thickness: ${unit === 'mm' ? mmToInches(thickness).toFixed(2) : thickness} inches\n`;
        content += `Has Overlaps: ${hasOverlaps ? 'Yes' : 'No'}\n`;
        content += `Total Tools: ${droppedTools.length}\n\n`;

        // Session Data
        const sessionData = sessionStorage.getItem('layoutForm');
        if (sessionData) {
            try {
                const layoutForm = JSON.parse(sessionData) as LayoutFormData;
                content += `LAYOUT METADATA\n`;
                content += `${'-'.repeat(20)}\n`;
                content += `Layout Name: ${layoutForm.layoutName || 'N/A'}\n`;
                content += `Brand: ${layoutForm.selectedBrand || 'N/A'}\n`;
                content += `Container Type: ${layoutForm.containerType || 'N/A'}\n\n`;
            } catch (error) {
                console.error('Error parsing session data:', error);
            }
        }

        // Tool Information
        content += `TOOLS DETAILS\n`;
        content += `${'-'.repeat(20)}\n`;

        droppedTools.forEach((tool, index) => {
            content += `Tool ${index + 1}:\n`;
            content += `  ID: ${tool.id}\n`;
            content += `  Original ID: ${tool.metadata?.originalId || 'N/A'}\n`;
            content += `  Name: ${tool.name}\n`;
            content += `  Brand: ${tool.brand}\n`;

            // Convert position from pixels to inches
            const xInches = convertPositionToInches(tool.x, canvasWidth);
            const yInches = convertPositionToInches(tool.y, canvasHeight);
            content += `  Position (pixels): (${Math.round(tool.x)}, ${Math.round(tool.y)})\n`;
            content += `  Position (inches): (${xInches.toFixed(2)}, ${yInches.toFixed(2)})\n`;

            content += `  Rotation: ${tool.rotation}°\n`;

            // Use diagonal inches instead of width × length
            if (tool.metadata?.diagonalInches) {
                content += `  Height (Diagonal): ${tool.metadata.diagonalInches} inches\n`;
            } else if (tool.width && tool.length) {
                const diagonal = Math.sqrt(tool.width ** 2 + tool.length ** 2);
                const diagInches = tool.unit === 'mm' ? mmToInches(diagonal).toFixed(2) : diagonal.toFixed(2);
                content += `  Height (Diagonal): ${diagInches} inches (calculated)\n`;
            } else {
                content += `  Height (Diagonal): N/A\n`;
            }

            content += `  Thickness: ${tool.unit === 'mm' ? mmToInches(tool.thickness).toFixed(2) : tool.thickness} inches\n`;
            content += `  Flip Horizontal: ${tool.flipHorizontal}\n`;
            content += `  Flip Vertical: ${tool.flipVertical}\n`;
            content += `  Opacity: ${tool.opacity}%\n`;
            content += `  Smooth: ${tool.smooth}\n`;

            if (tool.groupId) {
                content += `  Group ID: ${tool.groupId}\n`;
            }

            content += '\n';
        });

        // Summary Statistics
        content += `SUMMARY\n`;
        content += `${'-'.repeat(20)}\n`;
        const brands = [...new Set(droppedTools.map(tool => tool.brand))];
        const toolTypes = [...new Set(droppedTools.map(tool => tool.name))];

        content += `Unique Brands: ${brands.join(', ')}\n`;
        content += `Tool Types: ${toolTypes.join(', ')}\n`;
        content += `Layout Valid: ${!hasOverlaps ? 'Yes' : 'No'}\n`;

        return content;
    };

    // Download text file
    const downloadTextFile = () => {
        try {
            const content = generateTextFileData();
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `tool-layout-${timestamp}.txt`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setShowDropdown(false);
        } catch (error) {
            console.error('Error downloading text file:', error);
            setSaveError('Failed to generate text file');
        }
    };


    // Replace the uploadToDigitalOcean function in your Header.tsx with this:

    const uploadToDigitalOcean = async (blob: Blob): Promise<string> => {
        try {
            // Create form data with the image blob
            const formData = new FormData();
            formData.append('image', blob, 'layout.png');

            // Upload through your own API endpoint (no CORS issues)
            const response = await fetch('/api/upload-url', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Upload failed`);
            }

            const { success, fileUrl } = await response.json();

            if (!success || !fileUrl) {
                throw new Error('Invalid response from upload API');
            }

            console.log('Successfully uploaded image:', fileUrl);
            return fileUrl;

        } catch (error) {
            console.error('Error uploading to DigitalOcean:', error);
            throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };


    // Capture and download layout image

    const captureCanvasImage = async (): Promise<Blob> => {
        const layoutElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
        if (!layoutElement) {
            throw new Error("Canvas element not found. Make sure the canvas has data-canvas='true' attribute.");
        }

        // Save original styles to restore later
        const originalTransform = layoutElement.style.transform;
        const originalPosition = layoutElement.style.position;
        const originalZIndex = layoutElement.style.zIndex;

        try {
            // Temporarily adjust styles for better screenshot
            layoutElement.style.transform = "none";
            layoutElement.style.position = "static";
            layoutElement.style.zIndex = "auto";

            // Wait a bit for styles to apply
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await htmlToImage.toPng(layoutElement, {
                backgroundColor: "#ffffff",
                cacheBust: true,
                pixelRatio: 1, // Adjust for quality vs file size
                quality: 0.9,
                width: layoutElement.offsetWidth,
                height: layoutElement.offsetHeight,
            });

            // Convert base64 to Blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();

            console.log(`Canvas image captured: ${blob.size} bytes`);
            return blob;

        } catch (error) {
            console.error("Error capturing canvas image:", error);
            throw new Error(`Failed to capture image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Always restore original styles
            layoutElement.style.transform = originalTransform;
            layoutElement.style.position = originalPosition;
            layoutElement.style.zIndex = originalZIndex;
        }
    };



    const handleSaveAndExit = async () => {
        if (hasOverlaps) {
            setSaveError("Cannot save layout with overlapping tools. Please fix overlaps first.");
            return;
        }
        if (droppedTools.length === 0) {
            setSaveError("Cannot save empty layout. Please add at least one tool.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        let imageUrl: string | null = null;

        try {
            const authToken = getAuthToken();
            if (!authToken) throw new Error("Authentication required. Please log in again.");

            let additionalData: LayoutFormData = {};
            const sessionData = sessionStorage.getItem("layoutForm");
            if (sessionData) {
                try {
                    additionalData = JSON.parse(sessionData) as LayoutFormData;
                } catch (error) {
                    console.error("Error parsing session data:", error);
                }
            }

            // Step 1: Capture and upload image
            try {
                console.log("Capturing canvas image...");
                const canvasBlob = await captureCanvasImage();

                console.log("Uploading image to DigitalOcean...");
                imageUrl = await uploadToDigitalOcean(canvasBlob);

                console.log("Image uploaded successfully:", imageUrl);
            } catch (imageError) {
                console.warn("Failed to capture/upload image:", imageError);
                // Continue saving without image - don't fail the entire operation
                setSaveError("Warning: Could not save layout image, but layout data will still be saved.");
            }

            // Step 2: Save layout data with image URL
            const layoutData = {
                name: additionalData.layoutName || `Layout ${new Date().toLocaleDateString()}`,
                brand: additionalData.selectedBrand || "",
                containerType: additionalData.containerType || "",
                canvas: {
                    width: additionalData.canvasWidth ?? canvasWidth,
                    height: additionalData.canvasHeight ?? canvasHeight,
                    unit: additionalData.units ?? unit,
                    thickness: additionalData.thickness ?? thickness,
                },
                tools: droppedTools.map((tool) => ({
                    id: tool.id,
                    originalId: tool.metadata?.originalId,
                    name: tool.name,
                    x: tool.x,
                    y: tool.y,
                    rotation: tool.rotation,
                    flipHorizontal: tool.flipHorizontal,
                    flipVertical: tool.flipVertical,
                    thickness: tool.thickness,
                    unit: tool.unit,
                    opacity: tool.opacity || 100,
                    smooth: tool.smooth || 0,
                    image: tool.image,
                    groupId: tool.groupId,
                })),
                stats: {
                    totalTools: droppedTools.length,
                    validLayout: !hasOverlaps,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                snapshotUrl: imageUrl, // Will be null if upload failed
                ...additionalData,
            };

            console.log("Saving layout data:", { ...layoutData, snapshotUrl: imageUrl ? "✅ Included" : "❌ Failed" });

            const response = await fetch("/api/layouts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(layoutData),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to save layout");
            }

            // Clear any previous error if we got here
            setSaveError(null);
            setSaveSuccess(true);
            sessionStorage.removeItem("layoutForm");

            setTimeout(() => {
                onSaveLayout?.();
                window.location.href = "/workspace";
            }, 1500);

        } catch (error) {
            console.error("Error saving layout:", error);
            setSaveError(error instanceof Error ? error.message : "Failed to save layout");
        } finally {
            setIsSaving(false);
        }
    };


    const exportOptions = [
        {
            icon: FileText,
            label: 'Download Text File',
            action: downloadTextFile,
            disabled: false
        },
        {
            icon: File,
            label: 'Generate DXF File',
            action: generateDxfFile,
            disabled: droppedTools.length === 0,
            loading: isDxfGenerating
        },
        {
            icon: ShoppingCart,
            label: 'Add to cart',
            action: handleAddToCart,
            disabled: false
        },
    ];

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between">
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
                    <button
                        className={`flex items-center space-x-2 px-5 py-4 rounded-2xl text-sm font-medium transition-colors ${isSaving || hasOverlaps || droppedTools.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : saveSuccess
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-primary hover:bg-primary/90'
                            } text-white`}
                        onClick={handleSaveAndExit}
                        disabled={isSaving || hasOverlaps || droppedTools.length === 0}
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : saveSuccess ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Saved!</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save & Exit</span>
                            </>
                        )}
                    </button>

                    {/* Export Options Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            className="px-4 py-4 rounded-2xl bg-primary hover:bg-primary/90 transition-colors"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <MoreHorizontal className="w-5 h-5 text-white" />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="py-2">
                                    <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                                        Export Options
                                    </div>
                                    {exportOptions.map((option, index) => (
                                        <button
                                            key={index}
                                            className={`w-full px-4 py-3 text-left text-sm flex items-center space-x-3 transition-colors ${option.disabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                }`}
                                            onClick={option.disabled ? undefined : option.action}
                                            disabled={option.disabled}
                                        >
                                            {option.loading ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <option.icon className="w-4 h-4" />
                                            )}
                                            <span>
                                                {option.loading ? 'Generating DXF...' : option.label}
                                            </span>
                                            {option.disabled && !option.loading && droppedTools.length === 0 && (
                                                <span className="ml-auto text-xs text-gray-400">(Add tools first)</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {saveSuccess && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-800">Layout Saved Successfully!</p>
                            <p className="text-sm text-green-700 mt-1">Your design has been saved and you&apos;ll be redirected shortly.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Saving Message */}
            {isSaving && !saveSuccess && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Saving Layout...</p>
                            <p className="text-sm text-blue-700 mt-1">Please wait while we save your design.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* DXF Generation Message */}
            {isDxfGenerating && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Generating DXF File...</p>
                            <p className="text-sm text-blue-700 mt-1">Please wait while we create your industrial layout file via Gradio.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {saveError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Operation Failed</p>
                            <p className="text-sm text-red-700 mt-1">{saveError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Status */}
            <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                    <span className="text-gray-600">
                        Tools: <span className="font-medium">{droppedTools.length}</span>
                    </span>
                    <span className="text-gray-600">
                        Canvas: <span className="font-medium">{canvasWidth} × {canvasHeight} {unit}</span>
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    {hasOverlaps ? (
                        <>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">Invalid Layout</span>
                        </>
                    ) : droppedTools.length === 0 ? (
                        <>
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-600">No Tools</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-600">Ready to Save</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;