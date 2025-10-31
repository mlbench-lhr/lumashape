"use client";
import React, { useState, useCallback, useEffect } from 'react';
import {
    Search,
    ChevronDown,
    Hand
} from 'lucide-react';
import Image from 'next/image';
import { DroppedTool, Tool, ToolGroup } from './types';
import DraggableTool from './DraggableTool';
import {
    flipToolRelativeToRotation,
    groupSelectedTools,
    ungroupSelectedTools,
    copySelectedTools,
    pasteTools,
    deleteSelectedTools,
    alignTools,
    autoLayout,
    createShape,
    updateToolAppearance,
    createFingerCut,
    updateFingerCutDimensions,
    updateShapeDimensions,
    updateShapeDepth
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
    canvasWidth?: number;
    canvasHeight?: number;
    unit?: 'mm' | 'inches';
    setActiveTool?: (tool: 'cursor' | 'hand' | 'box' | 'fingercut') => void;
    readOnly?: boolean;
}


// Database tool interface
interface DatabaseTool {
    _id: string;
    userEmail: string;
    toolBrand: string;
    toolType: string;
    imageUrl: string;
    outlinesImg: string;
    length: number;
    depth: number;
    SKUorPartNumber: string;
    dxfLink: string;
    scaleFactor: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    cvResponse?: {
        contour_image_url?: string;
    };
}


// Sidebar (within component)
// Sidebar component (add brand filter state and dropdown UI, and apply filtering)
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
    canvasWidth,
    canvasHeight,
    unit,
    setActiveTool = () => { },
    readOnly = false,
}) => {

    const [activeTab, setActiveTab] = useState<'inventory' | 'edit'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isContourMode, setIsContourMode] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [addedToolIds, setAddedToolIds] = useState<Set<string>>(new Set());

    const selectedToolObject = selectedTool ? droppedTools.find(tool => tool.id === selectedTool) : null;
    const isFingerCutSelected = selectedToolObject?.metadata?.isFingerCut;
    const isShapeSelected = selectedToolObject?.toolBrand === 'SHAPE';

    // Local draft state for shape inputs
    const [shapeSettingsDraft, setShapeSettingsDraft] = useState({
        diameter: '',
        width: '',
        length: '',
        depth: '',
    });

    useEffect(() => {
        if (isShapeSelected && selectedToolObject) {
            if (selectedToolObject.toolType === 'circle') {
                setShapeSettingsDraft({
                    diameter: String(selectedToolObject.width ?? ''),
                    width: '',
                    length: '',
                    depth: String(selectedToolObject.depth ?? ''),
                });
            } else {
                setShapeSettingsDraft({
                    diameter: '',
                    width: String(selectedToolObject.width ?? ''),
                    length: String(selectedToolObject.length ?? ''),
                    depth: String(selectedToolObject.depth ?? ''),
                });
            }
        }
    }, [isShapeSelected, selectedToolObject]);

    const applyShapeSettings = useCallback(() => {
        if (!selectedTool || !isShapeSelected || !selectedToolObject) return;

        if (selectedToolObject.toolType === 'circle') {
            const diameter = parseFloat(shapeSettingsDraft.diameter);
            const depth = parseFloat(shapeSettingsDraft.depth);

            if (!isNaN(diameter) && diameter > 0) {
                updateShapeDimensions(selectedTool, droppedTools, setDroppedTools, diameter, diameter);
            }
            if (!isNaN(depth) && depth >= 0) {
                updateShapeDepth(selectedTool, droppedTools, setDroppedTools, depth);
            }
        } else {
            const width = parseFloat(shapeSettingsDraft.width);
            const length = parseFloat(shapeSettingsDraft.length);
            const depth = parseFloat(shapeSettingsDraft.depth);

            const widthArg = !isNaN(width) && width > 0 ? width : undefined;
            const lengthArg = !isNaN(length) && length > 0 ? length : undefined;
            if (widthArg !== undefined || lengthArg !== undefined) {
                // Fallback to current values to maintain function arity
                const w = widthArg !== undefined ? widthArg : selectedToolObject.width;
                const l = lengthArg !== undefined ? lengthArg : selectedToolObject.length;
                updateShapeDimensions(selectedTool, droppedTools, setDroppedTools, w, l);
            }
            if (!isNaN(depth) && depth >= 0) {
                updateShapeDepth(selectedTool, droppedTools, setDroppedTools, depth);
            }
        }

        onHistoryChange?.();
    }, [selectedTool, isShapeSelected, selectedToolObject, shapeSettingsDraft, droppedTools, setDroppedTools, onHistoryChange]);

    // Extract database tool data into separate variables
    const extractToolData = (dbTool: DatabaseTool) => {
        const {
            _id,
            userEmail,
            toolBrand,
            toolType,
            imageUrl,
            outlinesImg,
            length,
            depth,
            SKUorPartNumber,
            dxfLink,
            scaleFactor,
            createdAt,
            updatedAt,
            __v,
            cvResponse
        } = dbTool;

        return {
            id: _id,
            userEmail,
            toolBrand,
            toolType,
            imageUrl,
            outlinesImg,
            contour_image_url: cvResponse?.contour_image_url,
            length,
            depth,
            SKUorPartNumber,
            dxfLink,
            scaleFactor,
            createdAt,
            updatedAt,
            version: __v
        };
    };

    const handleAddToInventoryFromLayout = async (tool: DroppedTool) => {
        const originalId = tool.metadata?.originalId;
        if (!originalId) {
            alert("This tool cannot be added to inventory (missing original ID).");
            return;
        }

        // Confirm intent
        const confirmed = window.confirm("Are you sure you want to add this tool to your tool inventory?");
        if (!confirmed) return;

        // Duplicate checks: existing inventory or already added in this session
        const alreadyInInventory = tools.some(t => t.id === originalId);
        const alreadyAddedThisSession = addedToolIds.has(originalId);
        if (alreadyInInventory || alreadyAddedThisSession) {
            alert("Tool already exists in your inventory.");
            return;
        }

        try {
            setActionLoading(`add-${tool.id}`);
            const token = localStorage.getItem("auth-token");
            if (!token) {
                throw new Error("Authentication required");
            }
            const res = await fetch("/api/user/tool/addToInventory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ toolId: originalId })
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                const message = error?.error || "Failed to add tool to inventory";
                // Normalize server duplicate errors to user-friendly text
                if (/exist/i.test(message)) {
                    alert("Tool already exists in your inventory.");
                    return;
                }
                throw new Error(message);
            }

            // Mark as added in-session
            setAddedToolIds(prev => {
                const next = new Set(prev);
                next.add(originalId);
                return next;
            });

            alert("Tool added to your inventory successfully!");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to add tool to inventory";
            alert(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCircleDiameterChange = useCallback((diameter: number) => {
        if (!selectedTool || !isShapeSelected || !selectedToolObject) return;
        updateShapeDimensions(selectedTool, droppedTools, setDroppedTools, diameter, diameter);
        onHistoryChange?.();
    }, [selectedTool, isShapeSelected, selectedToolObject, droppedTools, setDroppedTools, onHistoryChange]);

    const handleRectangleDimensionChange = useCallback((dimension: 'width' | 'length', value: number) => {
        if (!selectedTool || !isShapeSelected || !selectedToolObject) return;
        const newWidth = dimension === 'width' ? value : selectedToolObject.width;
        const newLength = dimension === 'length' ? value : selectedToolObject.length;
        updateShapeDimensions(selectedTool, droppedTools, setDroppedTools, newWidth, newLength);
        onHistoryChange?.();
    }, [selectedTool, isShapeSelected, selectedToolObject, droppedTools, setDroppedTools, onHistoryChange]);

    const handleShapeDepthChange = useCallback((depthInches: number) => {
        if (!selectedTool || !isShapeSelected) return;
        updateShapeDepth(selectedTool, droppedTools, setDroppedTools, depthInches);
        onHistoryChange?.();
    }, [selectedTool, isShapeSelected, droppedTools, setDroppedTools, onHistoryChange]);

    // Handle finger cut creation
    const handleCreateFingerCut = useCallback(() => {
        if (canvasWidth && canvasHeight) {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            createFingerCut(droppedTools, setDroppedTools, { x: centerX, y: centerY }, canvasWidth, canvasHeight, unit);
            onHistoryChange?.();
        }
    }, [droppedTools, setDroppedTools, canvasWidth, canvasHeight, unit, onHistoryChange]);


    // Handle finger cut dimension updates
    const handleFingerCutDimensionChange = useCallback((dimension: 'width' | 'length', value: number) => {
        if (selectedTool && isFingerCutSelected) {
            const currentTool = selectedToolObject;
            if (currentTool) {
                const newWidth = dimension === 'width' ? value : currentTool.width;
                const newLength = dimension === 'length' ? value : currentTool.length;
                updateFingerCutDimensions(selectedTool, droppedTools, setDroppedTools, newWidth, newLength);
                onHistoryChange?.();
            }
        }
    }, [selectedTool, isFingerCutSelected, selectedToolObject, droppedTools, setDroppedTools, onHistoryChange]);


    // Parse scale info from processing data
    const parseScaleInfo = (processingData: string) => {
        try {
            const data = JSON.parse(processingData);
            if (!data.scale_info) return null;

            const scaleInfoStr = data.scale_info;
            const scaleMatch = scaleInfoStr.match(/Scale:\s*([\d.e-]+)\s*mm\/px/);
            const diagonalMatch = data.diagonal_inches;

            return {
                scale: scaleMatch ? parseFloat(scaleMatch[1]) : null,
                diagonal_inches: diagonalMatch || null,
                raw: data
            };
        } catch (error) {
            console.error('Error parsing scale info:', error);
            return null;
        }
    };

    // convertDatabaseToolsToTools()
    const convertDatabaseToolsToTools = (dbTools: DatabaseTool[]): Tool[] => {
        return dbTools.map((dbTool) => {
            const extractedData = extractToolData(dbTool);

            return {
                id: extractedData.id,
                name: extractedData.toolType || 'Unknown Tool',
                icon: getToolIcon(extractedData.toolType),
                toolBrand: extractedData.toolBrand,
                toolType: extractedData.toolType,
                image: extractedData.contour_image_url || extractedData.imageUrl,
                metadata: {
                    userEmail: extractedData.userEmail,
                    toolBrand: extractedData.toolBrand,
                    toolType: extractedData.toolType,
                    imageUrl: extractedData.imageUrl,
                    outlinesImg: extractedData.outlinesImg,
                    contour_image_url: extractedData.contour_image_url,
                    length: extractedData.length,
                    depth: extractedData.depth,
                    SKUorPartNumber: extractedData.SKUorPartNumber,
                    dxfLink: extractedData.dxfLink,
                    scaleFactor: extractedData.scaleFactor,
                    createdAt: extractedData.createdAt,
                    updatedAt: extractedData.updatedAt,
                    version: extractedData.version
                }
            };
        });
    };


    // Helper function to get appropriate icon based on tool type
    const getToolIcon = (toolType: string): string => {
        const toolTypeIconMap: { [key: string]: string } = {
            'pliers': '🔧',
            'hammer': '🔨',
            'screwdriver': '🪛',
            'wrench': '🔧',
            'drill': '🪚',
            'saw': '🪚',
            'custom': '🔧' // default for custom tools
        };

        const normalizedToolType = toolType?.toLowerCase() || '';

        // Check for partial matches
        for (const [key, icon] of Object.entries(toolTypeIconMap)) {
            if (normalizedToolType.includes(key)) {
                return icon;
            }
        }

        return '🔧'; // default icon
    };

    // Get tool real dimensions for display (helper function)
    const getToolRealDimensions = (tool: DroppedTool): { width: string; height: string; info: string } => {
        const diagInches = tool.metadata?.length;
        const scaleFactor = tool.metadata?.scaleFactor;

        if (diagInches && scaleFactor) {
            const diagMm = diagInches * 25.4;
            const diagPx = diagMm / scaleFactor;

            return {
                width: `~${Math.round(diagPx * 0.8)}px`,
                height: `~${Math.round(diagPx * 0.5)}px`,
                info: 'Estimated'
            };
        }

        return {
            width: 'Unknown',
            height: 'Unknown',
            info: 'No scale data'
        };
    };


    // Fetch tools from database
    const fetchTools = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('auth-token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/user/tool/getAllTools', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tools: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched tools from database:', data.tools);

            // Convert database tools to component format
            const convertedTools = convertDatabaseToolsToTools(data.tools || []);
            setTools(convertedTools);

        } catch (err) {
            console.error('Error fetching tools:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch tools');
            // Fallback to empty array on error
            setTools([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch tools on component mount
    useEffect(() => {
        fetchTools();
    }, []);

    // NEW: brand filter state and dropdown control
    const [brandFilter, setBrandFilter] = useState<'all' | 'Milwaukee' | 'Husky' | 'DEWALT'>('all');
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
    const brandOptions = ['Milwaukee', 'Husky', 'DEWALT'];
    const filteredTools = tools
        .filter(tool => brandFilter === 'all' || (tool.toolBrand || '').toLowerCase() === brandFilter.toLowerCase())
        .filter(tool =>
            tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tool.metadata?.toolBrand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tool.metadata?.toolType || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Determine effective selected tools - use selectedTool if selectedTools is empty
    const effectiveSelectedTools = selectedTools.length > 0 ? selectedTools : (selectedTool ? [selectedTool] : []);

    // Tool manipulation handlers

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

    const handleCreateShape = useCallback((shapeType: 'circle' | 'square' | 'cylinder') => {
        const position = { x: 200, y: 150 };
        createShape(droppedTools, setDroppedTools, shapeType, position, canvasWidth, canvasHeight, unit);
        onHistoryChange?.();
    }, [droppedTools, setDroppedTools, onHistoryChange, canvasWidth, canvasHeight, unit]);

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

            {/* Sort by brand */}
            <div className="relative flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div
                    className="flex items-center space-x-1 text-sm text-primary cursor-pointer select-none"
                    onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
                >
                    <span>{brandFilter === 'all' ? 'All Tool Brands' : brandFilter}</span>
                    <ChevronDown className="w-4 h-4" />
                </div>

                {isBrandMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-md z-10">
                        <button
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${brandFilter === 'all' ? 'text-primary' : 'text-gray-700'}`}
                            onClick={() => { setBrandFilter('all'); setIsBrandMenuOpen(false); }}
                        >
                            All Tool Brands
                        </button>
                        {brandOptions.map((brand) => (
                            <button
                                key={brand}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${brandFilter === brand ? 'text-primary' : 'text-gray-700'}`}
                                onClick={() => { setBrandFilter(brand as 'Milwaukee' | 'Husky' | 'DEWALT'); setIsBrandMenuOpen(false); }}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Existing inventory rendering */}
            {loading && (
                <div className="text-center text-gray-500 py-8">
                    <p>Loading tools...</p>
                </div>
            )}

            {error && (
                <div className="text-center text-red-500 py-8">
                    <p>Error: {error}</p>
                    <button
                        onClick={fetchTools}
                        className="mt-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="space-y-2">
                        {filteredTools.map((tool) => (
                            <DraggableTool key={tool.id} tool={tool} readOnly={readOnly} />
                        ))}
                    </div>

                    {filteredTools.length === 0 && tools.length > 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p>No tools found matching &quot;{searchTerm}&quot;</p>
                        </div>
                    )}

                    {tools.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p>No tools available</p>
                            <p className="text-xs mt-1">Add some tools to get started</p>
                        </div>
                    )}
                </>
            )}
        </>
    );

    const LayoutToolsView = () => {
        const filteredLayoutTools = droppedTools
            .filter(t => !t.metadata?.isFingerCut && t.toolBrand !== 'SHAPE')
            .filter(t => brandFilter === 'all' || (t.toolBrand || '').toLowerCase() === brandFilter.toLowerCase())
            .filter(t =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.toolBrand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.metadata?.toolType || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

        return (
            <>
                <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search layout tools"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                </div>

                <div className="space-y-2">
                    {filteredLayoutTools.map((tool) => {
                        const originalId = tool.metadata?.originalId;
                        const inInventory = originalId ? tools.some(t => t.id === originalId) : false;
                        const addedSession = originalId ? addedToolIds.has(originalId) : false;
                        const isLoading = actionLoading === `add-${tool.id}`;
                        const canAdd = !!originalId && !isLoading && !inInventory && !addedSession;

                        return (
                            <DraggableTool
                                key={tool.id}
                                tool={tool}
                                readOnly={true}
                                actions={
                                    <button
                                        onClick={() => handleAddToInventoryFromLayout(tool)}
                                        disabled={!canAdd}
                                        className={`px-2 py-1 text-xs rounded border ${canAdd
                                            ? 'text-primary border-primary hover:bg-primary/10'
                                            : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                            }`}
                                        title={
                                            !originalId
                                                ? 'Missing original ID'
                                                : inInventory || addedSession
                                                    ? 'Tool already exists'
                                                    : ''
                                        }
                                    >
                                        {inInventory || addedSession
                                            ? 'Added'
                                            : isLoading
                                                ? 'Adding...'
                                                : 'Add'}
                                    </button>
                                }
                            />
                        );
                    })}
                </div>

                {filteredLayoutTools.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <p>No tools in this layout</p>
                    </div>
                )}
            </>
        );
    };


    const editActions = [
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
        // {
        //     icon: "/images/workspace/group.svg",
        //     label: 'group',
        //     action: handleGroup,
        //     disabled: effectiveSelectedTools.length < 2
        // },
        // {
        //     icon: "/images/workspace/ungroup.svg",
        //     label: 'ungroup',
        //     action: handleUngroup,
        //     disabled: effectiveSelectedTools.length === 0 || !effectiveSelectedTools.some(id =>
        //         droppedTools.find(tool => tool.id === id)?.groupId
        //     )
        // },
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
            icon: "/images/workspace/delete.svg",
            label: 'delete',
            action: handleDelete,
            disabled: effectiveSelectedTools.length === 0
        },
        // {
        //     icon: "/images/workspace/layout.svg",
        //     label: 'Auto Layout',
        //     action: handleAutoLayout,
        //     disabled: effectiveSelectedTools.length < 2
        // },
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
                        Real-size tools based on scale data
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

            {/* Finger Cut Controls */}
            {/* {isFingerCutSelected && selectedToolObject && (
                <div className="bg-primary-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-primary-800 mb-3 flex items-center gap-2">
                        <Hand className="w-4 h-4" />
                        Finger Cut Settings
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                                Width ({unit})
                            </label>
                            <input
                                type="number"
                                value={selectedToolObject.width}
                                onChange={(e) => handleFingerCutDimensionChange('width', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                min="10"
                                max="200"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                                Length ({unit})
                            </label>
                            <input
                                type="number"
                                value={selectedToolObject.length}
                                onChange={(e) => handleFingerCutDimensionChange('length', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                min="10"
                                max="200"
                                step="1"
                            />
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                            💡 Finger cuts create easy-access areas in foam for grabbing tools
                        </div>
                    </div>
                </div>
            )} */}



            {/* Alignment Section */}
            {/* <div>
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
            </div> */}

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
                    <div className="flex flex-col items-center">
                        {/* Finger cut tool toggle (activates drawing mode) */}
                        <button
                            className="flex flex-col items-center space-y-1 p-2 rounded hover:bg-gray-100"
                            onClick={() => setActiveTool('fingercut')}
                            disabled={readOnly}
                            title="Finger Cut (draw between two points)"
                        >
                            <Image
                                src="/images/workspace/cylinder.svg"
                                alt="cylindrical finger cut"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <span className="text-xs text-gray-500 text-center leading-tight">finger cut</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Shape Settings */}
            {isShapeSelected && selectedToolObject && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-primary mb-3">Shape Settings</h3>

                    {selectedToolObject.toolType === 'circle' ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-primary mb-1">
                                    Diameter ({unit})
                                </label>
                                <input
                                    type="number"
                                    value={shapeSettingsDraft.diameter}
                                    onChange={(e) => setShapeSettingsDraft(prev => ({ ...prev, diameter: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-primary mb-1">
                                    Depth (inches)
                                </label>
                                <input
                                    type="number"
                                    value={shapeSettingsDraft.depth}
                                    onChange={(e) => setShapeSettingsDraft(prev => ({ ...prev, depth: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={applyShapeSettings}
                                    className="px-3 py-1 text-sm rounded bg-primary text-white"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-primary mb-1">
                                    Width ({unit})
                                </label>
                                <input
                                    type="number"
                                    value={shapeSettingsDraft.width}
                                    onChange={(e) => setShapeSettingsDraft(prev => ({ ...prev, width: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-primary mb-1">
                                    Length ({unit})
                                </label>
                                <input
                                    type="number"
                                    value={shapeSettingsDraft.length}
                                    onChange={(e) => setShapeSettingsDraft(prev => ({ ...prev, length: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-primary mb-1">
                                    Depth (inches)
                                </label>
                                <input
                                    type="number"
                                    value={shapeSettingsDraft.depth}
                                    onChange={(e) => setShapeSettingsDraft(prev => ({ ...prev, depth: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={applyShapeSettings}
                                    className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-blue-700"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tool Properties Section (if tool is selected) */}
            {/* {selectedToolObject && (
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
                        {(() => {
                            const realDims = getToolRealDimensions(selectedToolObject);
                            return (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Size:</span>
                                    <span className="text-gray-900">{realDims.width} × {realDims.height}</span>
                                </div>
                            );
                        })()}
                        {selectedToolObject?.metadata?.scaleFactor && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Scale:</span>
                                <span className="text-gray-900 text-xs">
                                    {selectedToolObject.metadata.scaleFactor.toFixed(3)} mm/px
                                </span>
                            </div>
                        )}
                        {selectedToolObject?.metadata?.length && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Diagonal:</span>
                                <span className="text-gray-900 text-xs">
                                    {selectedToolObject.metadata.length.toFixed(2)} in
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            )} */}

            {/* Scale Info Section */}
            {/* <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scale Information</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                        {"Tools now display at their real size based on scale data from processing."}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        {"Each tool's dimensions are calculated from the scale information in the database."}
                    </p>
                </div>
            </div> */}
        </div>
    );

    return (
        <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4">
                {readOnly ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Tools in Layout</h3>
                        </div>
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                            <LayoutToolsView />
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>


    );
};

export default Sidebar;
