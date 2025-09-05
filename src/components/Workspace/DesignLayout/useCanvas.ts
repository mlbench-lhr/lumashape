import { useRef, useState, useEffect, useCallback } from 'react';
import { DroppedTool, Tool } from './types';

interface UseCanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTools: string[];
  setSelectedTools: React.Dispatch<React.SetStateAction<string[]>>;
  onSave?: (tools: DroppedTool[]) => void;
  canvasWidth: number;
  canvasHeight: number;
  unit: 'mm' | 'inches';
  activeTool: 'cursor' | 'hand' | 'box';
}

export const useCanvas = ({
  droppedTools,
  setDroppedTools,
  selectedTool,
  setSelectedTool,
  selectedTools,
  setSelectedTools,
  onSave,
  canvasWidth,
  canvasHeight,
  unit,
  activeTool,
}: UseCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [initialPositions, setInitialPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Canvas panning state
  const [canvasPosition, setCanvasPosition] = useState({ x: 100, y: 100 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });
  
  const DPI = 96;

  // Unit conversion functions
  const toPx = useCallback((value: number, fromUnit: 'mm' | 'inches') => {
    if (fromUnit === "inches") return value * DPI;
    return (value / 25.4) * DPI;
  }, [DPI]);

  // Convert canvas dimensions to pixels for styling
  const getCanvasStyle = useCallback(() => {
    const widthPx = Math.max(100, toPx(canvasWidth, unit));
    const heightPx = Math.max(100, toPx(canvasHeight, unit));
    
    return {
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    };
  }, [canvasWidth, canvasHeight, unit, toPx]);

  // Tool-specific dimensions based on tool type
  const getToolDimensions = useCallback((tool: DroppedTool) => {
    // Define tool-specific sizes (in pixels)
    const toolSizes: Record<string, { width: number; height: number }> = {
      'Pliers': { width: 120, height: 60 },
      'Hammer': { width: 80, height: 100 },
      'Screwdriver': { width: 20, height: 140 },
      'Wrench': { width: 100, height: 30 },
      'Drill': { width: 90, height: 90 },
      'Saw': { width: 150, height: 40 },
      // Default size for unknown tools
      'default': { width: 80, height: 80 }
    };

    const size = toolSizes[tool.name] || toolSizes['default'];
    return { 
      toolWidth: size.width, 
      toolHeight: size.height 
    };
  }, []);

  // Enhanced thickness calculation for 3D effect
  const getShadowOffset = useCallback((tool: DroppedTool) => {
    const { thickness, unit: toolUnit } = tool;

    if (toolUnit === 'mm') {
      if (thickness <= 12.7) return 8;   // Thin material
      if (thickness <= 25.4) return 16;  // Medium material  
      return 24;                         // Thick material
    } else {
      // For inches (0.5", 1", 1.5")
      if (thickness <= 0.5) return 8;
      if (thickness <= 1.0) return 16;
      return 24;
    }
  }, []);

  // Check if a tool is within the selection rectangle
  const isToolInSelectionBox = useCallback((tool: DroppedTool, selBox: typeof selectionBox) => {
    if (!selBox) return false;
    
    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const minX = Math.min(selBox.startX, selBox.currentX);
    const maxX = Math.max(selBox.startX, selBox.currentX);
    const minY = Math.min(selBox.startY, selBox.currentY);
    const maxY = Math.max(selBox.startY, selBox.currentY);

    // Check if tool overlaps with selection box
    return !(tool.x + toolWidth < minX || 
             tool.x > maxX || 
             tool.y + toolHeight < minY || 
             tool.y > maxY);
  }, [getToolDimensions]);

  useEffect(() => {
    if (onSave) {
      onSave(droppedTools);
    }
  }, [droppedTools, onSave]);

  // Canvas panning handlers
  const handleCanvasDragStart = useCallback((e: React.MouseEvent) => {
    // Only allow canvas panning when clicking on empty container area
    if (e.target === canvasContainerRef.current && !isDraggingSelection) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({ x: e.clientX - canvasPosition.x, y: e.clientY - canvasPosition.y });
      e.preventDefault();
    }
  }, [canvasPosition, isDraggingSelection]);

  const handleCanvasDrag = useCallback((e: React.MouseEvent) => {
    if (isDraggingCanvas && canvasContainerRef.current) {
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const canvasStyle = getCanvasStyle();
      const canvasWidth = parseInt(canvasStyle.width);
      const canvasHeight = parseInt(canvasStyle.height);
      
      const newX = Math.min(
        containerRect.width - 50, // Keep some canvas visible on right
        Math.max(-canvasWidth + 50, e.clientX - canvasDragStart.x) // Keep some canvas visible on left
      );
      const newY = Math.min(
        containerRect.height - 50, // Keep some canvas visible on bottom
        Math.max(-canvasHeight + 50, e.clientY - canvasDragStart.y) // Keep some canvas visible on top
      );
      
      setCanvasPosition({ x: newX, y: newY });
    }
  }, [isDraggingCanvas, canvasDragStart, getCanvasStyle]);

  const handleCanvasDragEnd = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  // Event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const toolData = e.dataTransfer.getData('application/json');
    if (toolData && canvasRef.current) {
      const tool: Tool = JSON.parse(toolData);
      const rect = canvasRef.current.getBoundingClientRect();

      // Get tool-specific dimensions
      const mockTool = { ...tool, name: tool.name } as DroppedTool;
      const { toolWidth, toolHeight } = getToolDimensions(mockTool);

      const x = Math.max(0, Math.min(
        e.clientX - rect.left - (toolWidth / 2),
        rect.width - toolWidth
      ));
      const y = Math.max(0, Math.min(
        e.clientY - rect.top - (toolHeight / 2),
        rect.height - toolHeight
      ));

      const newTool: DroppedTool = {
        ...tool,
        id: `${tool.id}-${Date.now()}`,
        x,
        y,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        width: 50, // Logical width (not used for rendering)
        length: 50, // Logical length (not used for rendering)
        thickness: unit === 'mm' ? 12.7 : 0.5, // Default thickness
        unit,
        opacity: 100,
        smooth: 0,
      };

      setDroppedTools(prev => [...prev, newTool]);
    }
  }, [getToolDimensions, unit, setDroppedTools]);

  const handleToolMouseDown = useCallback((e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTool === 'cursor') {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select mode
        if (selectedTools.includes(toolId)) {
          setSelectedTools(prev => prev.filter(id => id !== toolId));
          if (selectedTool === toolId) {
            setSelectedTool(selectedTools.find(id => id !== toolId) || null);
          }
        } else {
          setSelectedTools(prev => [...prev, toolId]);
          setSelectedTool(toolId);
        }
      } else {
        // Single select mode
        if (selectedTools.includes(toolId)) {
          // If clicking on an already selected tool, start drag
          setSelectedTool(toolId);
        } else {
          // Select only this tool
          setSelectedTools([toolId]);
          setSelectedTool(toolId);
        }
      }
    } else if (activeTool === 'hand') {
      // Hand tool: start dragging if tool is selected
      if (selectedTools.includes(toolId)) {
        setSelectedTool(toolId);
        setIsDraggingSelection(true);
        
        // Store initial positions for all selected tools
        const positions: Record<string, { x: number; y: number }> = {};
        selectedTools.forEach(id => {
          const tool = droppedTools.find(t => t.id === id);
          if (tool) {
            positions[id] = { x: tool.x, y: tool.y };
          }
        });
        setInitialPositions(positions);

        const tool = droppedTools.find(t => t.id === toolId);
        if (tool && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const offsetX = e.clientX - rect.left - tool.x;
          const offsetY = e.clientY - rect.top - tool.y;
          setDragOffset({ x: offsetX, y: offsetY });
        }
      } else {
        // If clicking on an unselected tool with hand, first select it
        setSelectedTools([toolId]);
        setSelectedTool(toolId);
      }
    }
  }, [activeTool, selectedTool, selectedTools, droppedTools, setSelectedTool, setSelectedTools]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current && activeTool === 'cursor' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      if (!e.ctrlKey && !e.metaKey) {
        // Clear selection if not holding Ctrl/Cmd
        setSelectedTools([]);
        setSelectedTool(null);
      }

      setSelectionBox({
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        isSelecting: true
      });
    }
  }, [activeTool, setSelectedTools, setSelectedTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();

      // Handle selection box
      if (selectionBox?.isSelecting) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        setSelectionBox(prev => prev ? {
          ...prev,
          currentX,
          currentY
        } : null);

        // Update selection based on current selection box
        const newSelectionBox = { ...selectionBox, currentX, currentY };
        const toolsInBox = droppedTools.filter(tool => 
          isToolInSelectionBox(tool, newSelectionBox)
        ).map(tool => tool.id);

        if (e.ctrlKey || e.metaKey) {
          // Add to existing selection
          setSelectedTools(prev => {
            const combined = [...new Set([...prev, ...toolsInBox])];
            return combined;
          });
        } else {
          // Replace selection
          setSelectedTools(toolsInBox);
          setSelectedTool(toolsInBox[toolsInBox.length - 1] || null);
        }
      }

      // Handle dragging selected tools
      if (dragOffset && isDraggingSelection && activeTool === 'hand' && selectedTool) {
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        
        // Calculate delta from initial position
        const primaryTool = droppedTools.find(t => t.id === selectedTool);
        if (primaryTool && selectedTool && initialPositions[selectedTool]) {
          const deltaX = newX - initialPositions[selectedTool].x;
          const deltaY = newY - initialPositions[selectedTool].y;

          setDroppedTools(prev =>
            prev.map(tool => {
              if (selectedTools.includes(tool.id) && initialPositions[tool.id]) {
                const { toolWidth, toolHeight } = getToolDimensions(tool);
                const newToolX = initialPositions[tool.id].x + deltaX;
                const newToolY = initialPositions[tool.id].y + deltaY;
                
                const constrainedX = Math.max(0, Math.min(newToolX, rect.width - toolWidth));
                const constrainedY = Math.max(0, Math.min(newToolY, rect.height - toolHeight));
                
                return { ...tool, x: constrainedX, y: constrainedY };
              }
              return tool;
            })
          );
        }
      }
    }
  }, [selectionBox, dragOffset, isDraggingSelection, activeTool, selectedTool, selectedTools, droppedTools, initialPositions, isToolInSelectionBox, getToolDimensions, setDroppedTools, setSelectedTools, setSelectedTool]);

  const handleMouseUp = useCallback(() => {
    setDragOffset(null);
    setIsDraggingSelection(false);
    setInitialPositions({});
    setSelectionBox(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If clicking on empty canvas area and not dragging, deselect all tools
    if (e.target === canvasRef.current && !selectionBox?.isSelecting) {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedTools([]);
        setSelectedTool(null);
      }
    }
  }, [selectionBox, setSelectedTool, setSelectedTools]);

  const handleDeleteTool = useCallback((toolId: string) => {
    setDroppedTools(prev => prev.filter(tool => tool.id !== toolId));
    setSelectedTools(prev => prev.filter(id => id !== toolId));
    if (selectedTool === toolId) {
      const remainingSelected = selectedTools.filter(id => id !== toolId);
      setSelectedTool(remainingSelected[0] || null);
    }
  }, [setDroppedTools, selectedTool, selectedTools, setSelectedTool, setSelectedTools]);

  const handleDeleteSelectedTools = useCallback(() => {
    if (selectedTools.length > 0) {
      setDroppedTools(prev => prev.filter(tool => !selectedTools.includes(tool.id)));
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [selectedTools, setDroppedTools, setSelectedTools, setSelectedTool]);

  const handleSaveCanvas = useCallback(() => {
    const canvasData = {
      tools: droppedTools,
      canvasWidth,
      canvasHeight,
      unit,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-design.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [droppedTools, canvasWidth, canvasHeight, unit]);

  const handleLoadCanvas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const canvasData = JSON.parse(e.target?.result as string);
          if (canvasData.tools && Array.isArray(canvasData.tools)) {
            setDroppedTools(canvasData.tools);
            setSelectedTools([]);
            setSelectedTool(null);
          }
        } catch (error) {
          console.error('Error loading canvas:', error);
        }
      };
      reader.readAsText(file);
    }
  }, [setDroppedTools, setSelectedTools, setSelectedTool]);

  // Style helpers
  const getCanvasCursor = useCallback(() => {
    switch (activeTool) {
      case 'cursor': return 'default';
      case 'hand': return 'grab';
      case 'box': return 'crosshair';
      default: return 'default';
    }
  }, [activeTool]);

  const getToolCursor = useCallback((toolId: string) => {
    if (activeTool === 'cursor') {
      return 'pointer';
    } else if (activeTool === 'hand') {
      return selectedTools.includes(toolId) ? (dragOffset ? 'grabbing' : 'grab') : 'grab';
    }
    return 'default';
  }, [activeTool, selectedTools, dragOffset]);

  return {
    // Refs
    canvasRef,
    canvasContainerRef,

    // State
    dragOffset,
    selectionBox,
    canvasPosition,

    // Utility functions
    getToolDimensions,
    getShadowOffset,
    getCanvasStyle,

    // Event handlers
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleDeleteTool,
    handleDeleteSelectedTools,
    handleSaveCanvas,
    handleLoadCanvas,

    // Canvas panning
    handleCanvasDragStart,
    handleCanvasDrag,
    handleCanvasDragEnd,

    // Style helpers
    getCanvasCursor,
    getToolCursor,
  };
};