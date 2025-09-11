'use client';
import React, { useState } from 'react';
import { MoreHorizontal, RefreshCw, Save, AlertTriangle, CheckCircle } from 'lucide-react';
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

    // Helper function to get auth token from localStorage
    const getAuthToken = (): string | null => {
        try {
            return localStorage.getItem('auth-token');
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
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

                    <button className="px-4 py-4 rounded-2xl bg-primary">
                        <MoreHorizontal className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {saveSuccess && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-800">Layout Saved Successfully!</p>
                            <p className="text-sm text-green-700 mt-1">Your design has been saved and you'll be redirected shortly.</p>
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