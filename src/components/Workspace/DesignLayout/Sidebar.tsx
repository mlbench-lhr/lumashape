"use client";
import React, { useState, useCallback } from 'react';
import {
    Search,
    ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { DroppedTool, Tool, ToolGroup } from './types';
import DraggableTool from './DraggableTool';
import {
    rotateTool,
    flipToolRelativeToRotation,
    groupSelectedTools,
    ungroupSelectedTools,
    copySelectedTools,
    pasteTools,
    deleteSelectedTools,
    alignTools,
    autoLayout,
    createShape,
    updateToolAppearance
} from './toolUtils';

interface SidebarProps {
    droppedTools?: DroppedTool[];
    selectedTool?: string | null;
    selectedTools?: string[];
    activeTool?: string;
    groups?: ToolGroup[];
    setDroppedTools?: (updater: React.SetStateAction<DroppedTool[]>) => void;
    setGroups?: (updater: React.SetStateAction<ToolGroup[]>) => void;
    setSelectedTools?: (tools: string[]) => void;
    onHistoryChange?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
}

const TOOLS: Tool[] = [
    { id: '1', name: 'Pliers', icon: '🔧', brand: 'MILWAUKEE', image: '/images/workspace/pliers.png' },
    { id: '2', name: 'Hammer', icon: '🔨', brand: 'DEWALT', image: '/images/workspace/pliers.png' },
    { id: '3', name: 'Screwdriver', icon: '🪛', brand: 'MILWAUKEE', image: '/images/workspace/pliers.png' },
    { id: '4', name: 'Wrench', icon: '🔧', brand: 'CRAFTSMAN', image: '/images/workspace/pliers.png' },
    { id: '5', name: 'Drill', icon: '🪚', brand: 'DEWALT', image: '/images/workspace/pliers.png' },
    { id: '6', name: 'Saw', icon: '🪚', brand: 'MILWAUKEE', image: '/images/workspace/pliers.png' },
];

const Sidebar: React.FC<SidebarProps> = ({
    droppedTools = [],
    selectedTool = null,
    selectedTools = [],
    activeTool = 'cursor',
    groups = [],
    setDroppedTools = () => { },
    setGroups = () => { },
    setSelectedTools = () => { },
    onHistoryChange,
    canUndo = false,
    canRedo = false,
    onUndo = () => { },
    onRedo = () => { }
}) => {

    const [activeTab, setActiveTab] = useState<'inventory' | 'edit'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTools = TOOLS.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get the selected tool object for appearance controls
    const selectedToolObject = selectedTool ? droppedTools.find(tool => tool.id === selectedTool) : null;

    // Determine effective selected tools - use selectedTool if selectedTools is empty
    const effectiveSelectedTools = selectedTools.length > 0 ? selectedTools : (selectedTool ? [selectedTool] : []);

    // History handlers
    const handleUndo = useCallback(() => {
        onUndo();
        setSelectedTools([]);
        onHistoryChange?.();
    }, [onUndo, setSelectedTools, onHistoryChange]);

    const handleRedo = useCallback(() => {
        onRedo();
        setSelectedTools([]);
        onHistoryChange?.();
    }, [onRedo, setSelectedTools, onHistoryChange]);

    // Tool manipulation handlers
    const handleRotate = useCallback((degrees: number) => {
        if (selectedTool) {
            rotateTool(selectedTool, droppedTools, activeTool, selectedTool, setDroppedTools, degrees);
            onHistoryChange?.();
        }
    }, [selectedTool, droppedTools, activeTool, setDroppedTools, onHistoryChange]);

    const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
        if (selectedTool) {
            flipToolRelativeToRotation(selectedTool, droppedTools, activeTool, selectedTool, setDroppedTools, direction);
            onHistoryChange?.();
        }
    }, [selectedTool, droppedTools, activeTool, setDroppedTools, onHistoryChange]);

    const handleGroup = useCallback(() => {
        groupSelectedTools(droppedTools, effectiveSelectedTools, setDroppedTools, setGroups);
        onHistoryChange?.();
    }, [droppedTools, effectiveSelectedTools, setDroppedTools, setGroups, onHistoryChange]);

    const handleUngroup = useCallback(() => {
        ungroupSelectedTools(droppedTools, effectiveSelectedTools, setDroppedTools, setGroups);
        onHistoryChange?.();
    }, [droppedTools, effectiveSelectedTools, setDroppedTools, setGroups, onHistoryChange]);

    const handleCopy = useCallback(() => {
        copySelectedTools(droppedTools, effectiveSelectedTools, groups);
    }, [droppedTools, effectiveSelectedTools, groups]);

    const handlePaste = useCallback(() => {
        const newToolIds = pasteTools(droppedTools, setDroppedTools, setGroups);
        if (newToolIds.length > 0) {
            if (setSelectedTools) setSelectedTools(newToolIds);
            onHistoryChange?.();
        }
    }, [droppedTools, setDroppedTools, setGroups, setSelectedTools, onHistoryChange]);

    const handleDelete = useCallback(() => {
        deleteSelectedTools(droppedTools, effectiveSelectedTools, setDroppedTools, setGroups);
        if (setSelectedTools) setSelectedTools([]);
        onHistoryChange?.();
    }, [droppedTools, effectiveSelectedTools, setDroppedTools, setGroups, setSelectedTools, onHistoryChange]);

    const handleAlign = useCallback((alignment: 'top' | 'bottom') => {
        alignTools(droppedTools, effectiveSelectedTools, setDroppedTools, alignment);
        onHistoryChange?.();
    }, [droppedTools, effectiveSelectedTools, setDroppedTools, onHistoryChange]);

    const handleAutoLayout = useCallback(() => {
        autoLayout(droppedTools, effectiveSelectedTools, setDroppedTools);
        onHistoryChange?.();
    }, [droppedTools, effectiveSelectedTools, setDroppedTools, onHistoryChange]);

    const handleCreateShape = useCallback((shapeType: 'circle' | 'square') => {
        const position = { x: 200, y: 150 };
        createShape(droppedTools, setDroppedTools, shapeType, position);
        onHistoryChange?.();
    }, [droppedTools, setDroppedTools, onHistoryChange]);

    const handleAppearanceChange = useCallback((property: 'opacity' | 'smooth', value: number) => {
        if (selectedTool) {
            updateToolAppearance(selectedTool, droppedTools, setDroppedTools, property, value);
            onHistoryChange?.();
        }
    }, [selectedTool, droppedTools, setDroppedTools, onHistoryChange]);

    const ToolInventoryView = () => (
        <>
            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Tools"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex items-center space-x-1 text-sm text-blue-600 cursor-pointer">
                    <span>All Brands</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            <div className="space-y-2">
                {filteredTools.map((tool) => (
                    <DraggableTool key={tool.id} tool={tool} />
                ))}
            </div>

            {filteredTools.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    <p>No tools found matching &quot;{searchTerm}&quot;</p>
                </div>
            )}
        </>
    );

    const editActions = [
        {
            icon: "/images/workspace/rotate_left.svg",
            label: 'rotate left',
            action: () => handleRotate(-90),
            disabled: !selectedTool
        },
        {
            icon: "/images/workspace/rotate_right.svg",
            label: 'rotate right',
            action: () => handleRotate(90),
            disabled: !selectedTool
        },
        {
            icon: "/images/workspace/flip-horizontal.svg",
            label: 'flip horizontal',
            action: () => handleFlip('horizontal'),
            disabled: !selectedTool
        },
        {
            icon: "/images/workspace/flip_vertical.svg",
            label: 'flip vertical',
            action: () => handleFlip('vertical'),
            disabled: !selectedTool
        },
        {
            icon: "/images/workspace/group.svg",
            label: 'group',
            action: handleGroup,
            disabled: effectiveSelectedTools.length < 2
        },
        {
            icon: "/images/workspace/ungroup.svg",
            label: 'ungroup',
            action: handleUngroup,
            disabled: effectiveSelectedTools.length === 0 || !effectiveSelectedTools.some(id =>
                droppedTools.find(tool => tool.id === id)?.groupId
            )
        },
        {
            icon: "/images/workspace/undo.svg",
            label: 'undo',
            action: handleUndo,
            disabled: !canUndo
        },
        {
            icon: "/images/workspace/redo.svg",
            label: 'redo',
            action: handleRedo,
            disabled: !canRedo
        },
        {
            icon: "/images/workspace/copy.svg",
            label: 'copy',
            action: handleCopy,
            disabled: effectiveSelectedTools.length === 0
        },
        {
            icon: "/images/workspace/paste.svg",
            label: 'paste',
            action: handlePaste,
            disabled: false
        },
        {
            icon: "/images/workspace/zoom.svg",
            label: 'Zoom',
            disabled: true
        },
        {
            icon: "/images/workspace/delete.svg",
            label: 'delete',
            action: handleDelete,
            disabled: effectiveSelectedTools.length === 0
        },
        {
            icon: "/images/workspace/layout.svg",
            label: 'Auto Layout',
            action: handleAutoLayout,
            disabled: effectiveSelectedTools.length < 2
        },
    ];

    const EditLayoutView = () => (
        <div className="space-y-6">
            {/* Selection Info */}
            <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                    {effectiveSelectedTools.length === 0
                        ? 'No tools selected'
                        : `${effectiveSelectedTools.length} tool${effectiveSelectedTools.length > 1 ? 's' : ''} selected`
                    }
                </p>
                {selectedToolObject && (
                    <p className="text-xs text-gray-500 mt-1">
                        Fixed size tools on canvas
                    </p>
                )}
            </div>

            {/* Edit Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit</h3>
                <div className="grid grid-cols-6 gap-2">
                    {editActions.map((action, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <button
                                className={`w-10 h-10 rounded-md flex items-center justify-center mb-1 transition-colors ${action.disabled
                                    ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                    : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                                    }`}
                                onClick={action.action}
                                disabled={action.disabled}
                            >
                                <div className='w-6 h-6'>
                                    <Image
                                        src={action.icon}
                                        alt={action.label}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </button>
                            <span className="text-xs text-gray-500 text-center leading-tight">{action.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Appearance Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                <div className="space-y-4">
                    {/* Opacity */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 w-16">Opacity</span>
                        <div className="flex justify-between items-center space-x-2 bg-[#F5F5F5] w-28 px-2 py-1 rounded">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={selectedToolObject?.opacity || 100}
                                onChange={(e) => handleAppearanceChange('opacity', parseInt(e.target.value) || 0)}
                                disabled={effectiveSelectedTools.length === 0}
                                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none disabled:opacity-50"
                            />
                            <Image
                                src="/images/workspace/appearance.svg"
                                alt="opacity"
                                width={16}
                                height={16}
                                className="opacity-60"
                            />
                        </div>
                    </div>

                    {/* Smooth */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 w-16">Smooth</span>
                        <div className="flex justify-between items-center space-x-2 bg-[#F5F5F5] w-28 px-2 py-1 rounded">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={selectedToolObject?.smooth || 100}
                                onChange={(e) => handleAppearanceChange('smooth', parseInt(e.target.value) || 0)}
                                disabled={!selectedTool}
                                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none disabled:opacity-50"
                            />
                            <Image
                                src="/images/workspace/appearance.svg"
                                alt="smooth"
                                width={16}
                                height={16}
                                className="opacity-60"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alignment Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alignment</h3>
                <div className="flex space-x-4">
                    <div className="flex flex-col items-center">
                        <button
                            className={`w-10 h-10 rounded-md flex items-center justify-center mb-1 transition-colors ${effectiveSelectedTools.length < 2
                                ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                                }`}
                            onClick={() => handleAlign('top')}
                            disabled={effectiveSelectedTools.length < 2}
                        >
                            <div className='w-6 h-6'>
                                <Image
                                    src="/images/workspace/align_top.svg"
                                    alt="align top"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">align top</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button
                            className={`w-10 h-10 rounded-md flex items-center justify-center mb-1 transition-colors ${effectiveSelectedTools.length < 2
                                ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                                }`}
                            onClick={() => handleAlign('bottom')}
                            disabled={effectiveSelectedTools.length < 2}
                        >
                            <div className='w-6 h-6'>
                                <Image
                                    src="/images/workspace/align_bottom.svg"
                                    alt="align bottom"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">align bottom</span>
                    </div>
                </div>
            </div>

            {/* Add Shapes Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Shapes</h3>
                <div className="flex space-x-4">
                    <div className="flex flex-col items-center">
                        <button
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1 transition-colors cursor-pointer"
                            onClick={() => handleCreateShape('circle')}
                        >
                            <div className='w-6 h-6'>
                                <Image
                                    src="/images/workspace/circle.svg"
                                    alt="circle"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">circle</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1 transition-colors cursor-pointer"
                            onClick={() => handleCreateShape('square')}
                        >
                            <div className='w-6 h-6'>
                                <Image
                                    src="/images/workspace/square.svg"
                                    alt="square"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">square</span>
                    </div>
                </div>
            </div>

            {/* Tool Properties Section (if tool is selected) */}
            {selectedToolObject && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Properties</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Name:</span>
                            <span className="text-gray-900">{selectedToolObject.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Thickness:</span>
                            <span className="text-gray-900">{selectedToolObject.thickness} {selectedToolObject.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Rotation:</span>
                            <span className="text-gray-900">{selectedToolObject.rotation}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Position:</span>
                            <span className="text-gray-900">({Math.round(selectedToolObject.x)}, {Math.round(selectedToolObject.y)})</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Size:</span>
                            <span className="text-gray-900">Fixed (80×80px)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Info */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas Info</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                        Canvas dimensions are controlled by the Control Bar above.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Tools maintain fixed visual size regardless of canvas dimensions.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4">
                <div className="flex justify-between items-center space-x-2 mb-4 bg-gray-100 py-2 px-2 rounded-md">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 transition-colors ${activeTab === 'inventory'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Tool Inventory
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 transition-colors ${activeTab === 'edit'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('edit')}
                    >
                        Edit Layout
                    </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    {activeTab === 'inventory' ? <ToolInventoryView /> : <EditLayoutView />}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;