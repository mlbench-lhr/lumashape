import { useRef, useState, useEffect, useCallback } from 'react';
import { DroppedTool, Tool } from './types';

interface UseCanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
  onSave?: (tools: DroppedTool[]) => void;
  width: number;
  length: number;
  thickness: number;
  unit: 'mm' | 'inches';
  onCanvasDimensionsChange?: (dimensions: { width: number; height: number; maxWidth: number; maxHeight: number; unit: 'mm' | 'inches' }) => void;
  activeTool: 'cursor' | 'hand' | 'box';
}

export const useCanvas = ({
  droppedTools,
  setDroppedTools,
  selectedTool,
  setSelectedTool,
  onSave,
  width,
  length,
  thickness,
  unit,
  onCanvasDimensionsChange,
  activeTool,
}: UseCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const DPI = 96;

  // Unit conversion functions
  const toPx = useCallback((value: number) => {
    if (unit === "inches") return value * DPI;
    return (value / 25.4) * DPI;
  }, [unit, DPI]);

  const fromPx = useCallback((pixels: number) => {
    if (unit === "inches") return pixels / DPI;
    return (pixels * 25.4) / DPI;
  }, [unit, DPI]);

  // Calculate maximum allowed dimensions based on specific canvas dimensions
  const getMaxDimensions = useCallback((canvasWidth: number, canvasHeight: number) => {
    const maxWidthPx = Math.max(canvasWidth - 40, 50);
    const maxHeightPx = Math.max(canvasHeight - 40, 50);

    return {
      maxWidth: Math.floor(fromPx(maxWidthPx) * 10) / 10,
      maxHeight: Math.floor(fromPx(maxHeightPx) * 10) / 10
    };
  }, [fromPx]);

  // Update canvas dimensions when canvas size changes
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newDimensions = { width: rect.width, height: rect.height };
        setCanvasDimensions(newDimensions);
      }
    };

    updateCanvasDimensions();

    const resizeObserver = new ResizeObserver(updateCanvasDimensions);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Separate useEffect to handle onCanvasDimensionsChange callback
  useEffect(() => {
    if (onCanvasDimensionsChange && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const { maxWidth, maxHeight } = getMaxDimensions(canvasDimensions.width, canvasDimensions.height);
      onCanvasDimensionsChange({
        ...canvasDimensions,
        maxWidth,
        maxHeight,
        unit
      });
    }
  }, [canvasDimensions.width, canvasDimensions.height, unit, onCanvasDimensionsChange, getMaxDimensions]);

  useEffect(() => {
    if (onSave) {
      onSave(droppedTools);
    }
  }, [droppedTools, onSave]);

  // Calculate dynamic tool dimensions with constraints
  const toolWidth = Math.min(toPx(width), canvasDimensions.width - 40);
  const toolHeight = Math.min(toPx(length), canvasDimensions.height - 40);

  // Enhanced thickness calculation - better scaling for your specific values
  const getShadowOffset = useCallback(() => {
    // For your specific thickness values (12.7, 25.4, 38.1mm), create more dramatic scaling
    if (unit === 'mm') {
      if (thickness <= 12.7) return 8;   // Thin material
      if (thickness <= 25.4) return 16;  // Medium material  
      return 24;                         // Thick material
    } else {
      // For inches (0.5", 1", 1.5")
      if (thickness <= 0.5) return 8;
      if (thickness <= 1.0) return 16;
      return 24;
    }
  }, [unit, thickness]);

  // Calculate border thickness based on material thickness
  const getBorderThickness = useCallback(() => {
    // More dramatic scaling for border thickness
    if (unit === 'mm') {
      if (thickness <= 12.7) return 2;
      if (thickness <= 25.4) return 4;
      return 6;
    } else {
      if (thickness <= 0.5) return 2;
      if (thickness <= 1.0) return 4;
      return 6;
    }
  }, [unit, thickness]);

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
      const x = e.clientX - rect.left - (toolWidth / 2);
      const y = e.clientY - rect.top - (toolHeight / 2);

      const newTool: DroppedTool = {
        ...tool,
        id: `${tool.id}-${Date.now()}`,
        x,
        y,
        rotation: 0,
      };

      setDroppedTools(prev => [...prev, newTool]);
    }
  }, [toolWidth, toolHeight, setDroppedTools]);

  const handleToolMouseDown = useCallback((e: React.MouseEvent, toolId: string) => {
    e.preventDefault();

    if (activeTool === 'cursor') {
      // Cursor tool: only select the tool, don't start dragging
      setSelectedTool(toolId);
    } else if (activeTool === 'hand') {
      // Hand tool: start dragging if tool is selected
      if (selectedTool === toolId) {
        const tool = droppedTools.find(t => t.id === toolId);
        if (tool && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const offsetX = e.clientX - rect.left - tool.x;
          const offsetY = e.clientY - rect.top - tool.y;
          setDragOffset({ x: offsetX, y: offsetY });
        }
      } else {
        // If clicking on an unselected tool with hand, first select it
        setSelectedTool(toolId);
      }
    }
  }, [activeTool, selectedTool, droppedTools, setSelectedTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Only allow dragging if we have drag offset, selected tool, and hand tool is active
    if (dragOffset && selectedTool && activeTool === 'hand' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      const constrainedX = Math.max(0, Math.min(newX, rect.width - toolWidth));
      const constrainedY = Math.max(0, Math.min(newY, rect.height - toolHeight));

      setDroppedTools(prev =>
        prev.map(tool =>
          tool.id === selectedTool
            ? { ...tool, x: constrainedX, y: constrainedY }
            : tool
        )
      );
    }
  }, [dragOffset, selectedTool, activeTool, toolWidth, toolHeight, setDroppedTools]);

  const handleMouseUp = useCallback(() => {
    setDragOffset(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If clicking on empty canvas area, deselect all tools
    if (e.target === canvasRef.current) {
      setSelectedTool(null);
    }
  }, [setSelectedTool]);

  const handleToolDoubleClick = useCallback((toolId: string) => {
    // Only allow rotation if cursor tool is active and tool is selected
    if (activeTool === 'cursor' && selectedTool === toolId) {
      setDroppedTools(prev =>
        prev.map(tool =>
          tool.id === toolId
            ? { ...tool, rotation: (tool.rotation + 90) % 360 }
            : tool
        )
      );
    }
  }, [activeTool, selectedTool, setDroppedTools]);

  const handleDeleteTool = useCallback((toolId: string) => {
    setDroppedTools(prev => prev.filter(tool => tool.id !== toolId));
    if (selectedTool === toolId) {
      setSelectedTool(null);
    }
  }, [setDroppedTools, selectedTool, setSelectedTool]);

  const handleSaveCanvas = useCallback(() => {
    const canvasData = {
      tools: droppedTools,
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
  }, [droppedTools]);

  const handleLoadCanvas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const canvasData = JSON.parse(e.target?.result as string);
          if (canvasData.tools && Array.isArray(canvasData.tools)) {
            setDroppedTools(canvasData.tools);
          }
        } catch (error) {
          console.error('Error loading canvas:', error);
        }
      };
      reader.readAsText(file);
    }
  }, [setDroppedTools]);

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
      return selectedTool === toolId ? (dragOffset ? 'grabbing' : 'grab') : 'grab';
    }
    return 'default';
  }, [activeTool, selectedTool, dragOffset]);

  // Computed values
  const shadowOffset = getShadowOffset();
  const borderThickness = getBorderThickness();

  return {
    // Refs
    canvasRef,
    
    // State
    canvasDimensions,
    dragOffset,
    
    // Computed values
    toolWidth,
    toolHeight,
    shadowOffset,
    borderThickness,
    
    // Event handlers
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleToolDoubleClick,
    handleDeleteTool,
    handleSaveCanvas,
    handleLoadCanvas,
    
    // Style helpers
    getCanvasCursor,
    getToolCursor,
  };
};