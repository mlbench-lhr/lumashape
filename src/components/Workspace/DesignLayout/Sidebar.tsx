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
    updateShapeDepth,
    updateFingerCutDepth
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
    originalToolId?: string;
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

    const [isEditingShapeInputs, setIsEditingShapeInputs] = useState(false);

    useEffect(() => {
        if (!isShapeSelected || !selectedToolObject || isEditingShapeInputs) return;

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
    }, [isShapeSelected, selectedToolObject, isEditingShapeInputs]);

    // Draft state for Finger Cut depth (to mirror Shape settings apply flow)
    const [fingerCutDraftDepth, setFingerCutDraftDepth] = useState('');

    useEffect(() => {
        if (isFingerCutSelected && selectedToolObject) {
            setFingerCutDraftDepth(String(selectedToolObject.depth ?? ''));
        }
    }, [isFingerCutSelected, selectedToolObject]);

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

    // Apply handler for Finger Cut depth
    const applyFingerCutSettings = useCallback(() => {
        if (!selectedTool || !isFingerCutSelected) return;
        const depth = parseFloat(fingerCutDraftDepth);
        if (!isNaN(depth) && depth >= 0) {
            updateFingerCutDepth(selectedTool, droppedTools, setDroppedTools, depth);
            onHistoryChange?.();
        }
    }, [selectedTool, isFingerCutSelected, fingerCutDraftDepth, droppedTools, setDroppedTools, onHistoryChange]);

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
            version: __v,
            metadata: {
                originalId: dbTool.originalToolId
            }
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
        const alreadyInInventory = tools.some(t => t.metadata?.originalId === originalId);
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

    const handleFingerCutDepthChange = useCallback((depthInches: number) => {
        if (!selectedTool || !isFingerCutSelected) return;
        updateFingerCutDepth(selectedTool, droppedTools, setDroppedTools, depthInches);
        onHistoryChange?.();
    }, [selectedTool, isFingerCutSelected, droppedTools, setDroppedTools, onHistoryChange]);


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
    const [brandFilter, setBrandFilter] = useState<'all' | string>('all');
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
    const brandOptions = Array.from(
        new Set(
            tools
                .map(t => (t.toolBrand || '').trim())
                .filter(Boolean)
        )
    ).sort((a, b) => a.localeCompare(b));
    // NEW: tool type filter state and dropdown control
    const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
    const typeOptions = Array.from(new Set(
        tools
            .map(t => (t.toolType || '').trim())
            .filter(Boolean)
    )).sort();

    const filteredTools = tools
        .filter(tool => brandFilter === 'all' || (tool.toolBrand || '').toLowerCase() === brandFilter.toLowerCase())
        .filter(tool => typeFilter === 'all' || (tool.toolType || '').toLowerCase() === typeFilter.toLowerCase())
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
                    placeholder="Search Keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
            </div>

            {/* Sort by brand and type - Fixed height to prevent collapse */}
            <div className="flex items-center justify-between mb-4 h-10">
                <div className="flex items-center gap-1">
                    {/* Brand filter (anchored to its own wrapper) */}
                    <div className="relative">
                        <button
                            className="flex items-center space-x-1 text-sm text-primary cursor-pointer select-none"
                            onClick={() => {
                                setIsBrandMenuOpen(!isBrandMenuOpen);
                                setIsTypeMenuOpen(false);
                            }}
                        >
                            <span>{brandFilter === 'all' ? 'Tool Brand' : brandFilter}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isBrandMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 origin-top-left">
                                <button
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${brandFilter === 'all' ? 'text-primary' : 'text-gray-700'}`}
                                    onClick={() => { setBrandFilter('all'); setIsBrandMenuOpen(false); }}
                                >
                                    Custom
                                </button>
                                {brandOptions.map((brand) => (
                                    <button
                                        key={brand}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${brandFilter === brand ? 'text-primary' : 'text-gray-700'}`}
                                        onClick={() => { setBrandFilter(brand); setIsBrandMenuOpen(false); }}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>



                    {/* Type filter (anchored to its own wrapper) */}
                    <div className="relative">
                        <button
                            className="flex items-center space-x-1 text-sm text-primary cursor-pointer select-none"
                            onClick={() => {
                                setIsTypeMenuOpen(!isTypeMenuOpen);
                                setIsBrandMenuOpen(false);
                            }}
                        >
                            <span>{typeFilter === 'all' ? 'Tool Type' : typeFilter}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isTypeMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 origin-top-right">
                                <button
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${typeFilter === 'all' ? 'text-primary' : 'text-gray-700'}`}
                                    onClick={() => { setTypeFilter('all'); setIsTypeMenuOpen(false); }}
                                >
                                    All Types
                                </button>
                                {typeOptions.map((type) => (
                                    <button
                                        key={type}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${typeFilter.toLowerCase() === type.toLowerCase() ? 'text-primary' : 'text-gray-700'}`}
                                        onClick={() => { setTypeFilter(type); setIsTypeMenuOpen(false); }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {(brandFilter !== 'all' || typeFilter !== 'all' || searchTerm.trim() !== '') && (
                        <button
                            className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 focus:outline-none"
                            onClick={() => {
                                setBrandFilter('all');
                                setTypeFilter('all');
                                setSearchTerm('');
                            }}
                        >
                            Clear
                        </button>
                    )}


                </div>
            </div>

            {/* Existing inventory rendering - Min height to prevent container collapse */}
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
                    <div className="space-y-2 min-h-96">
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

                <div className="space-y-2 min-h-96">
                    {filteredLayoutTools.map((tool) => {
                        const originalId = tool.metadata?.originalId;
                        const inInventory = originalId ? tools.some(t => t.metadata?.originalId === originalId) : false;
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
                                        className={`mb-2 mt-1 px-2 py-1 text-xs rounded border ${canAdd
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
            label: 'Mirror',
            action: () => handleFlip('horizontal'),
            disabled: !selectedTool
        },
        {
            icon: "/images/workspace/flip_vertical.svg",
            label: 'Invert',
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
            label: 'Copy',
            action: handleCopy,
            disabled: effectiveSelectedTools.length === 0
        },
        {
            icon: "/images/workspace/paste.svg",
            label: 'Paste',
            action: handlePaste,
            disabled: false
        },
        {
            icon: "/images/workspace/delete.svg",
            label: 'Delete',
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
                        <span className="text-xs text-gray-500 text-center leading-tight">Circle</span>
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
                        <span className="text-xs text-gray-500 text-center leading-tight">Square</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1 transition-colors cursor-pointer"
                            onClick={() => setActiveTool('fingercut')}
                            disabled={readOnly}
                        >
                            <div className='w-6 h-6'>
                                <Image
                                    src="/images/workspace/fingercut.svg"
                                    alt="cylindrical finger cut"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">Finger Grip</span>
                    </div>
                </div>
            </div>

            {/* Finger Cut Controls */}
            {isFingerCutSelected && selectedToolObject && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-primary">Shape Settings</h3>
                        <button
                            onClick={applyFingerCutSettings}
                            className="px-3 py-1 text-sm rounded bg-primary text-white"
                        >
                            Apply
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-primary mb-1">
                                Depth (inches)
                            </label>
                            <input
                                type="number"
                                value={fingerCutDraftDepth}
                                onChange={(e) => setFingerCutDraftDepth(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Shape Settings */}
            {isShapeSelected && selectedToolObject && !isFingerCutSelected && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-primary">Shape Settings</h3>
                        <button
                            onClick={applyShapeSettings}
                            className="px-3 py-1 text-sm rounded bg-primary text-white"
                        >
                            Apply
                        </button>
                    </div>

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
                                    onFocus={() => setIsEditingShapeInputs(true)}
                                    onBlur={() => setIsEditingShapeInputs(false)}
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
                                    onFocus={() => setIsEditingShapeInputs(true)}
                                    onBlur={() => setIsEditingShapeInputs(false)}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
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
                                    onFocus={() => setIsEditingShapeInputs(true)}
                                    onBlur={() => setIsEditingShapeInputs(false)}
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
                                    onFocus={() => setIsEditingShapeInputs(true)}
                                    onBlur={() => setIsEditingShapeInputs(false)}
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
                                    onFocus={() => setIsEditingShapeInputs(true)}
                                    onBlur={() => setIsEditingShapeInputs(false)}
                                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tool Properties Section (if tool is selected) */}
            {selectedToolObject && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Properties</h3>
                    <div className="space-y-3 text-sm">
                        {isFingerCutSelected && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Type:</span>
                                <span className="text-gray-900">Finger Grip</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Depth:</span>
                            <span className="text-gray-900">{Number(selectedToolObject.depth ?? 0).toFixed(2)} inches</span>
                        </div>
                        {!isShapeSelected && selectedToolObject.toolBrand !== 'FINGERCUT' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tool Brand:</span>
                                    <span className="text-gray-900">{selectedToolObject.toolBrand}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tool Type:</span>
                                    <span className="text-gray-900">{selectedToolObject.metadata?.toolType ?? selectedToolObject.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">SKU or Part Number:</span>
                                    <span className="text-gray-900">{selectedToolObject.metadata?.SKUorPartNumber ?? selectedToolObject.SKUorPartNumber}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

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
        <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
            <div className="p-4 flex flex-col h-full">
                {readOnly ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Tools in Layout</h3>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
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

                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {activeTab === 'inventory' ? <ToolInventoryView /> : <EditLayoutView />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
