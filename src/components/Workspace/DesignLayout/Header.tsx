'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, RefreshCw, Save, AlertTriangle, CheckCircle, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import Image from 'next/image';
import { DroppedTool } from './types';

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

// ✅ conversion helper
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
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // ✅ Helper function to convert pixel position to inches
    const convertPositionToInches = (pixelPosition: number, canvasDimension: number): number => {
        // Assuming the canvas is rendered with a specific pixel-to-unit ratio
        // You may need to adjust this based on your actual canvas scaling
        const canvasInInches = unit === 'mm' ? mmToInches(canvasDimension) : canvasDimension;
        
        // Get the actual canvas element to determine the pixel-to-inch ratio
        const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLDivElement;
        if (canvasElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            const pixelsPerInch = canvasRect.width / canvasInInches;
            return pixelPosition / pixelsPerInch;
        }
        
        // Fallback calculation if canvas element not found
        // Assume standard 96 DPI (pixels per inch)
        return pixelPosition / 96;
    };

    // ✅ Generate comprehensive text file data (always in inches + diagonal height + position in inches)
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
            content += `  Name: ${tool.name}\n`;
            content += `  Brand: ${tool.brand}\n`;
            
            // ✅ Convert position from pixels to inches
            const xInches = convertPositionToInches(tool.x, canvasWidth);
            const yInches = convertPositionToInches(tool.y, canvasHeight);
            content += `  Position (pixels): (${Math.round(tool.x)}, ${Math.round(tool.y)})\n`;
            content += `  Position (inches): (${xInches.toFixed(2)}, ${yInches.toFixed(2)})\n`;
            
            content += `  Rotation: ${tool.rotation}°\n`;

            // ✅ Use diagonal inches instead of width × length
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

    // Capture and download layout image
    const downloadLayoutImage = async () => {
        try {
            // Find the canvas element
            const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLDivElement;
            if (!canvasElement) {
                throw new Error('Canvas element not found');
            }

            // Use html2canvas or similar library (you'll need to install it)
            // For now, we'll use a simple approach with canvas API

            // Create a temporary canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            // Set canvas size based on the layout
            const canvasRect = canvasElement.getBoundingClientRect();
            canvas.width = canvasRect.width;
            canvas.height = canvasRect.height;

            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw canvas border
            ctx.strokeStyle = '#d1d5db';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

            // Add text overlay with layout info
            ctx.fillStyle = '#374151';
            ctx.font = '14px Arial';
            ctx.setLineDash([]);
            ctx.fillText(`Canvas: ${canvasWidth} × ${canvasHeight} ${unit}`, 20, 30);
            ctx.fillText(`Tools: ${droppedTools.length}`, 20, 50);
            ctx.fillText(`Status: ${hasOverlaps ? 'Invalid (Overlaps)' : 'Valid'}`, 20, 70);

            // Note: For a complete implementation, you would need to:
            // 1. Install html2canvas: npm install html2canvas
            // 2. Import and use it to capture the actual visual layout
            // This is a basic implementation for demonstration

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) throw new Error('Failed to create image blob');

                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `layout-image-${timestamp}.png`;

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');

            setShowDropdown(false);
        } catch (error) {
            console.error('Error downloading layout image:', error);
            setSaveError('Failed to generate layout image');
        }
    };

    const handleSaveAndExit = async () => {
        if (hasOverlaps) {
            setSaveError('Cannot save layout with overlapping tools. Please fix overlaps first.');
            return;
        }

        if (droppedTools.length === 0) {
            setSaveError('Cannot save empty layout. Please add at least one tool.');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Get auth token
            const authToken = getAuthToken();
            if (!authToken) {
                throw new Error('Authentication required. Please log in again.');
            }

            let additionalData: LayoutFormData = {};

            const sessionData = sessionStorage.getItem('layoutForm');
            if (sessionData) {
                try {
                    additionalData = JSON.parse(sessionData) as LayoutFormData;
                } catch (error) {
                    console.error('Error parsing session data:', error);
                }
            }

            const layoutData = {
                name: additionalData.layoutName || `Layout ${new Date().toLocaleDateString()}`,
                brand: additionalData.selectedBrand || '',
                containerType: additionalData.containerType || '',
                canvas: {
                    width: additionalData.canvasWidth ?? canvasWidth,
                    height: additionalData.canvasHeight ?? canvasHeight,
                    unit: additionalData.units ?? unit,
                    thickness: additionalData.thickness ?? thickness,
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
                ...additionalData,
            };

            console.log("Final layout data:", layoutData);

            // Make the API call
            const response = await fetch('/api/layouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(layoutData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to save layout');
            }

            // Success!
            setSaveSuccess(true);
            console.log('Layout saved successfully with ID:', result.id);

            // Clear session data after successful save
            sessionStorage.removeItem('layoutForm');

            // Call the success callback after a brief delay to show success message
            setTimeout(() => {
                onSaveLayout?.();
                // Redirect to workspace after successful save
                window.location.href = '/workspace';
            }, 1500);

        } catch (error) {
            console.error('Error saving layout:', error);
            setSaveError(error instanceof Error ? error.message : 'Failed to save layout');
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
            icon: ImageIcon,
            label: 'Download Layout Image',
            action: downloadLayoutImage,
            disabled: false
        },
        {
            icon: File,
            label: 'Generate DXF File',
            action: () => { }, // Placeholder
            disabled: true // Currently disabled as requested
        }
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
                                            <option.icon className="w-4 h-4" />
                                            <span>{option.label}</span>
                                            {option.disabled && (
                                                <span className="ml-auto text-xs text-gray-400">(Coming Soon)</span>
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

            {/* Error Message */}
            {saveError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Cannot Save Layout</p>
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