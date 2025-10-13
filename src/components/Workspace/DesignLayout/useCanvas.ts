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
  activeTool: 'cursor' | 'hand' | 'box' | 'fingercut';
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

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizingToolId, setResizingToolId] = useState<string | null>(null);
  const [initialResizeData, setInitialResizeData] = useState<{
    toolWidth: number;
    toolHeight: number;
    toolX: number;
    toolY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);


  // Overlap detection state
  const [hasOverlaps, setHasOverlaps] = useState(false);
  const [overlappingTools, setOverlappingTools] = useState<string[]>([]);

  // Viewport state (Figma-style navigation)
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1
  });

  const DPI = 96;

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mmToPx = useCallback((mm: number) => {
    // Use consistent DPI for all conversions
    const DPI = 96;
    return (mm / 25.4) * DPI;
  }, []);

  const inchesToPx = useCallback((inches: number) => {
    const DPI = 96;
    return inches * DPI;
  }, []);

  // Convert canvas dimensions to pixels for styling
  const getCanvasStyle = useCallback(() => {
    const widthPx = unit === 'mm' ? mmToPx(canvasWidth) : inchesToPx(canvasWidth);
    const heightPx = unit === 'mm' ? mmToPx(canvasHeight) : inchesToPx(canvasHeight);

    return {
      width: `${Math.max(100, widthPx)}px`,
      height: `${Math.max(100, heightPx)}px`,
    };
  }, [canvasWidth, canvasHeight, unit, mmToPx, inchesToPx]);

  // Get canvas boundaries in pixels
  const getCanvasBounds = useCallback(() => {
    const style = getCanvasStyle();
    return {
      width: parseInt(style.width),
      height: parseInt(style.height)
    };
  }, [getCanvasStyle]);

  // Get viewport transform for canvas and tools
  const getViewportTransform = useCallback(() => {
    return {
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      transformOrigin: '0 0'
    };
  }, [viewport]);

  // Tool-specific dimensions based on tool type
  // Inside useCanvas.ts




  // Tool-specific dimensions based on tool type
  const getToolDimensions = useCallback((tool: DroppedTool) => {
    if (tool.metadata?.length) {
      // 🔹 Now this is actually the HEIGHT of the tool, not the diagonal
      const toolHeightPx = inchesToPx(tool.metadata.length);

      // Default aspect ratio if natural dimensions are missing
      let aspectRatio = 1.6;

      if (
        tool.metadata?.naturalWidth &&
        tool.metadata?.naturalHeight &&
        tool.metadata.naturalWidth > 0 &&
        tool.metadata.naturalHeight > 0
      ) {
        aspectRatio = tool.metadata.naturalWidth / tool.metadata.naturalHeight;
      }

      const toolWidthPx = toolHeightPx * aspectRatio;

      return {
        toolWidth: Math.max(20, toolWidthPx),
        toolHeight: Math.max(20, toolHeightPx),
      };
    }

    // Legacy fallback if no diagonalInches
    return {
      toolWidth: tool.width || 50,
      toolHeight: tool.length || 50,
    };
  }, [inchesToPx]);


  // Constrain tool position to canvas boundaries
  const constrainToCanvas = useCallback((tool: DroppedTool, x: number, y: number) => {
    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const { width: canvasWidthPx, height: canvasHeightPx } = getCanvasBounds();

    const constrainedX = Math.max(0, Math.min(x, canvasWidthPx - toolWidth));
    const constrainedY = Math.max(0, Math.min(y, canvasHeightPx - toolHeight));

    return { x: constrainedX, y: constrainedY };
  }, [getToolDimensions, getCanvasBounds]);

  // Check if two tools overlap
  const doToolsOverlap = useCallback((tool1: DroppedTool, tool2: DroppedTool) => {
    // Bypass overlap check if either tool is a cylinder
    const isTool1Cylinder = tool1.id.startsWith('cylinder_') || tool1.name === 'Finger Cut';
    const isTool2Cylinder = tool2.id.startsWith('cylinder_') || tool2.name === 'Finger Cut';
    
    if (isTool1Cylinder || isTool2Cylinder) {
      return false; // No overlap for cylinders
    }

    const { toolWidth: w1, toolHeight: h1 } = getToolDimensions(tool1);
    const { toolWidth: w2, toolHeight: h2 } = getToolDimensions(tool2);

    // Add small buffer to prevent touching tools from being considered overlapping
    const buffer = 2;

    return !(tool1.x + w1 <= tool2.x + buffer ||
      tool2.x + w2 <= tool1.x + buffer ||
      tool1.y + h1 <= tool2.y + buffer ||
      tool2.y + h2 <= tool1.y + buffer);
  }, [getToolDimensions]);

  // Detect overlaps between tools
  const detectOverlaps = useCallback(() => {
    const overlaps: string[] = [];

    for (let i = 0; i < droppedTools.length; i++) {
      for (let j = i + 1; j < droppedTools.length; j++) {
        if (doToolsOverlap(droppedTools[i], droppedTools[j])) {
          if (!overlaps.includes(droppedTools[i].id)) {
            overlaps.push(droppedTools[i].id);
          }
          if (!overlaps.includes(droppedTools[j].id)) {
            overlaps.push(droppedTools[j].id);
          }
        }
      }
    }

    setOverlappingTools(overlaps);
    setHasOverlaps(overlaps.length > 0);
  }, [droppedTools, doToolsOverlap]);

  // Run overlap detection when tools change
  useEffect(() => {
    detectOverlaps();
  }, [detectOverlaps]);

  // Find non-overlapping position for a tool
  const findNonOverlappingPosition = useCallback((
    tool: DroppedTool,
    existingTools: DroppedTool[],
    startX?: number,
    startY?: number
  ) => {
    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const { width: canvasWidthPx, height: canvasHeightPx } = getCanvasBounds();
    const maxCanvasWidth = canvasWidthPx - toolWidth;
    const maxCanvasHeight = canvasHeightPx - toolHeight;

    let x = Math.max(0, Math.min(startX ?? tool.x, maxCanvasWidth));
    let y = Math.max(0, Math.min(startY ?? tool.y, maxCanvasHeight));

    const step = 20; // Grid step for positioning
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const testTool = { ...tool, x, y };

      // Check if this position overlaps with any existing tool
      const hasOverlap = existingTools.some(existingTool =>
        existingTool.id !== tool.id && doToolsOverlap(testTool, existingTool)
      );

      if (!hasOverlap) {
        return { x, y };
      }

      // Try next position in a spiral pattern
      const spiralIndex = Math.floor(attempts / 4);
      const direction = attempts % 4;

      switch (direction) {
        case 0: // Right
          x = Math.min(x + step * (spiralIndex + 1), maxCanvasWidth);
          break;
        case 1: // Down
          y = Math.min(y + step * (spiralIndex + 1), maxCanvasHeight);
          break;
        case 2: // Left
          x = Math.max(x - step * (spiralIndex + 1), 0);
          break;
        case 3: // Up
          y = Math.max(y - step * (spiralIndex + 1), 0);
          break;
      }

      attempts++;
    }

    // If no non-overlapping position found, return constrained position
    return constrainToCanvas(tool, startX ?? tool.x, startY ?? tool.y);
  }, [getToolDimensions, getCanvasBounds, doToolsOverlap, constrainToCanvas]);

  // Enhanced thickness calculation for 3D effect
  const getShadowOffset = useCallback((tool: DroppedTool) => {
    const { thickness, unit: toolUnit } = tool;

    if (toolUnit === 'mm') {
      if (thickness <= 12.7) return 8;
      if (thickness <= 25.4) return 16;
      return 24;
    } else {
      if (thickness <= 0.5) return 8;
      if (thickness <= 1.0) return 16;
      return 24;
    }
  }, []);

  // Convert screen coordinates to canvas coordinates (accounting for viewport)
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (screenX - rect.left - viewport.x) / viewport.zoom;
    const canvasY = (screenY - rect.top - viewport.y) / viewport.zoom;

    return { x: canvasX, y: canvasY };
  }, [viewport]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = canvasX * viewport.zoom + viewport.x + rect.left;
    const screenY = canvasY * viewport.zoom + viewport.y + rect.top;

    return { x: screenX, y: screenY };
  }, [viewport]);

  // Check if a tool is within the selection rectangle
  const isToolInSelectionBox = useCallback((tool: DroppedTool, selBox: typeof selectionBox) => {
    if (!selBox) return false;

    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const minX = Math.min(selBox.startX, selBox.currentX);
    const maxX = Math.max(selBox.startX, selBox.currentX);
    const minY = Math.min(selBox.startY, selBox.currentY);
    const maxY = Math.max(selBox.startY, selBox.currentY);

    return !(tool.x + toolWidth < minX ||
      tool.x > maxX ||
      tool.y + toolHeight < minY ||
      tool.y > maxY);
  }, [getToolDimensions]);

  // Zoom functionality
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const container = canvasContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));

    // Zoom towards mouse position
    const zoomRatio = newZoom / viewport.zoom;
    const newX = mouseX - (mouseX - viewport.x) * zoomRatio;
    const newY = mouseY - (mouseY - viewport.y) * zoomRatio;

    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [viewport]);

  // Attach wheel event listener
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan functionality
  const startPan = useCallback((e: MouseEvent | React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }, [viewport]);

  const updatePan = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!isPanning) return;

    setViewport(prev => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    }));
  }, [isPanning, panStart]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (!onSave) return;
    const timeout = setTimeout(() => onSave([...droppedTools]), 300);
    return () => clearTimeout(timeout);
  }, [droppedTools, onSave]);



  // Event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Updated handleDrop function in useCanvas.ts
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const toolData = e.dataTransfer.getData('application/json');
    if (toolData && canvasRef.current) {
      const tool: Tool = JSON.parse(toolData);

      // Convert drop position to canvas coordinates
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      // Create new tool with complete metadata
      const newTool: DroppedTool = {
        ...tool,
        id: `${tool.id}-${Date.now()}`, // Keep the unique dropped ID
        x: 0, // Will be calculated below
        y: 0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        width: 50, // Legacy fallback
        length: 50, // Legacy fallback
        thickness: unit === 'mm' ? 12.7 : 0.5,
        unit,
        opacity: 100,
        smooth: 0,
        metadata: {
          ...tool.metadata, // Preserve all existing metadata including diagonalInches
          originalId: tool.id, // ✅ STORE THE ORIGINAL ID HERE
        },
      };

      // Calculate dimensions with the complete tool object
      const { toolWidth, toolHeight } = getToolDimensions(newTool);

      // Center the tool on the drop position
      const x = canvasPos.x - (toolWidth / 2);
      const y = canvasPos.y - (toolHeight / 2);

      // Constrain to canvas boundaries
      const constrainedPos = constrainToCanvas(newTool, x, y);

      // Find non-overlapping position
      const nonOverlappingPos = findNonOverlappingPosition(
        { ...newTool, x: constrainedPos.x, y: constrainedPos.y },
        droppedTools,
        constrainedPos.x,
        constrainedPos.y
      );

      // Set final position
      newTool.x = nonOverlappingPos.x;
      newTool.y = nonOverlappingPos.y;

      setDroppedTools(prev => [...prev, newTool]);
    }
  }, [getToolDimensions, unit, setDroppedTools, screenToCanvas, constrainToCanvas, findNonOverlappingPosition, droppedTools]);

  const handleResizeStart = useCallback((e: React.MouseEvent, toolId: string, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();

    const tool = droppedTools.find(t => t.id === toolId);
    if (!tool) return;

    const { toolWidth, toolHeight } = getToolDimensions(tool);

    setIsResizing(true);
    setResizeHandle(handle);
    setResizingToolId(toolId);
    setInitialResizeData({
      toolWidth,
      toolHeight,
      toolX: tool.x,
      toolY: tool.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  }, [droppedTools, getToolDimensions]);

  // Handle resize during mouse move
  const handleResize = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !resizeHandle || !resizingToolId || !initialResizeData) return;

    const deltaX = e.clientX - initialResizeData.mouseX;
    const deltaY = e.clientY - initialResizeData.mouseY;

    // Find the tool being resized to check if it's a perfect shape
    const currentTool = droppedTools.find(t => t.id === resizingToolId);
    const isPerfectShape = currentTool && currentTool.toolBrand === 'SHAPE' && 
                          (currentTool.name.toLowerCase().includes('circle') || 
                           currentTool.name.toLowerCase().includes('square'));

    // Calculate new dimensions based on handle
    let newWidth = initialResizeData.toolWidth;
    let newHeight = initialResizeData.toolHeight;
    let newX = initialResizeData.toolX;
    let newY = initialResizeData.toolY;

    // For perfect shapes (squares and circles), always maintain 1:1 aspect ratio
    // For other shapes, maintain their original aspect ratio
    const aspectRatio = isPerfectShape ? 1 : (initialResizeData.toolWidth / initialResizeData.toolHeight);

    switch (resizeHandle) {
      case 'se': // Bottom-right
        newWidth = Math.max(20, initialResizeData.toolWidth + deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        break;
      case 'sw': // Bottom-left
        newWidth = Math.max(20, initialResizeData.toolWidth - deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newX = initialResizeData.toolX + (initialResizeData.toolWidth - newWidth);
        break;
      case 'ne': // Top-right
        newWidth = Math.max(20, initialResizeData.toolWidth + deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newY = initialResizeData.toolY + (initialResizeData.toolHeight - newHeight);
        break;
      case 'nw': // Top-left
        newWidth = Math.max(20, initialResizeData.toolWidth - deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newX = initialResizeData.toolX + (initialResizeData.toolWidth - newWidth);
        newY = initialResizeData.toolY + (initialResizeData.toolHeight - newHeight);
        break;
    }

    // Update the tool dimensions
    setDroppedTools(prev => prev.map(tool => {
      if (tool.id === resizingToolId) {
        // Calculate new size in the tool's unit
        const DPI = 96;
        const canvasInchesX = unit === 'mm' ? (canvasWidth / 25.4) : canvasWidth;
        const canvasInchesY = unit === 'mm' ? (canvasHeight / 25.4) : canvasHeight;

        const el = canvasRef.current;
        let baseWidthPx = canvasInchesX * DPI;
        let baseHeightPx = canvasInchesY * DPI;

        if (el) {
          const rect = el.getBoundingClientRect();
          baseWidthPx = rect.width / viewport.zoom;
          baseHeightPx = rect.height / viewport.zoom;
        }

        const ppiX = baseWidthPx / canvasInchesX;
        const ppiY = baseHeightPx / canvasInchesY;

        // Convert pixel dimensions back to tool units
        const newWidthInInches = newWidth / ppiX;
        const newHeightInInches = newHeight / ppiY;

        const newWidthInUnits = tool.unit === 'mm' ? newWidthInInches * 25.4 : newWidthInInches;
        const newHeightInUnits = tool.unit === 'mm' ? newHeightInInches * 25.4 : newHeightInInches;

        // For perfect shapes, ensure both dimensions are exactly equal
        const finalWidth = isPerfectShape ? newWidthInUnits : newWidthInUnits;
        const finalHeight = isPerfectShape ? newWidthInUnits : newHeightInUnits;

        return {
          ...tool,
          x: newX,
          y: newY,
          width: finalWidth,
          length: finalHeight,
          metadata: {
            ...tool.metadata,
            diagonalInches: Math.sqrt(newWidthInInches * newWidthInInches + newHeightInInches * newHeightInInches),
          }
        };
      }
      return tool;
    }));
  }, [isResizing, resizeHandle, resizingToolId, initialResizeData, setDroppedTools, viewport.zoom, unit, canvasWidth, canvasHeight, canvasRef, droppedTools]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    setResizingToolId(null);
    setInitialResizeData(null);
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isResizing) {
        // Check if the mousedown is on a resize handle or the tool being resized
        const target = e.target as HTMLElement;
        const isOnResizeHandle = target.closest('.resize-handle') || 
                                target.style.cursor?.includes('resize') ||
                                (target.parentElement && target.parentElement.style.cursor?.includes('resize'));
        
        // If clicking outside resize handles, stop resizing
        if (!isOnResizeHandle) {
          e.preventDefault();
          handleResizeEnd();
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousedown', handleMouseDown, true);
      return () => {
        document.removeEventListener('mousedown', handleMouseDown, true);
      };
    }
  }, [isResizing, handleResizeEnd]);

  const handleToolMouseDown = useCallback((e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for middle mouse button - enable panning
    if (e.button === 1) {
      startPan(e);
      return;
    }

    if (activeTool === 'cursor') {
      // Handle tool selection
      if (e.ctrlKey || e.metaKey) {
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
        if (selectedTools.includes(toolId)) {
          setSelectedTool(toolId);
        } else {
          setSelectedTools([toolId]);
          setSelectedTool(toolId);
        }
      }

      // Setup drag for the tool(s)
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const clickedTool = droppedTools.find(tool => tool.id === toolId);

      if (clickedTool) {
        // Set drag offset relative to the tool's position
        setDragOffset({
          x: canvasPos.x - clickedTool.x,
          y: canvasPos.y - clickedTool.y
        });

        // Store initial positions of all selected tools
        const toolsToMove = selectedTools.includes(toolId) ? selectedTools : [toolId];
        const positions: Record<string, { x: number; y: number }> = {};

        droppedTools.forEach(tool => {
          if (toolsToMove.includes(tool.id)) {
            positions[tool.id] = { x: tool.x, y: tool.y };
          }
        });

        setInitialPositions(positions);
        setIsDraggingSelection(true);
      }
    } else if (activeTool === 'hand') {
      // In hand mode, start panning the viewport
      startPan(e);
    }
  }, [activeTool, selectedTool, selectedTools, setSelectedTool, setSelectedTools, startPan, screenToCanvas, droppedTools]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Check for middle mouse button - enable panning regardless of active tool
    if (e.button === 1) {
      e.preventDefault();
      startPan(e);
      return;
    }

    if (activeTool === 'hand') {
      // Hand tool: start panning
      startPan(e);
    } else if (activeTool === 'cursor' && e.target === canvasRef.current) {
      // Cursor tool: start selection box
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      if (!e.ctrlKey && !e.metaKey) {
        setSelectedTools([]);
        setSelectedTool(null);
      }

      setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
        isSelecting: true
      });
    }
  }, [activeTool, setSelectedTools, setSelectedTool, startPan, screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {

    // Handle resizing first
    if (isResizing) {
      handleResize(e);
      return;
    }

    // Handle viewport panning (only when not dragging tools)
    if (isPanning && (activeTool === 'hand' || !isDraggingSelection)) {
      updatePan(e);
      return;
    }

    // Handle selection box
    if (selectionBox?.isSelecting && activeTool === 'cursor' && !isDraggingSelection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      setSelectionBox(prev => prev ? {
        ...prev,
        currentX: canvasPos.x,
        currentY: canvasPos.y
      } : null);

      const newSelectionBox = { ...selectionBox, currentX: canvasPos.x, currentY: canvasPos.y };
      const toolsInBox = droppedTools.filter(tool =>
        isToolInSelectionBox(tool, newSelectionBox)
      ).map(tool => tool.id);

      if (e.ctrlKey || e.metaKey) {
        setSelectedTools(prev => {
          const combined = [...new Set([...prev, ...toolsInBox])];
          return combined;
        });
      } else {
        setSelectedTools(toolsInBox);
        setSelectedTool(toolsInBox[toolsInBox.length - 1] || null);
      }
    }

    // Handle tool dragging (only in cursor mode) - WITH BOUNDARY CONSTRAINTS
    if (dragOffset && isDraggingSelection && activeTool === 'cursor' && selectedTool) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;

      const primaryTool = droppedTools.find(t => t.id === selectedTool);
      if (primaryTool && selectedTool && initialPositions[selectedTool]) {
        const deltaX = newX - initialPositions[selectedTool].x;
        const deltaY = newY - initialPositions[selectedTool].y;

        setDroppedTools(prev =>
          prev.map(tool => {
            if (selectedTools.includes(tool.id) && initialPositions[tool.id]) {
              const proposedX = initialPositions[tool.id].x + deltaX;
              const proposedY = initialPositions[tool.id].y + deltaY;

              // CONSTRAIN TO CANVAS BOUNDARIES
              const constrainedPos = constrainToCanvas(tool, proposedX, proposedY);

              return {
                ...tool,
                x: constrainedPos.x,
                y: constrainedPos.y
              };
            }
            return tool;
          })
        );
      }
    }
  }, [
    isPanning,
    activeTool,
    updatePan,
    selectionBox,
    screenToCanvas,
    isToolInSelectionBox,
    droppedTools,
    setSelectedTools,
    setSelectedTool,
    dragOffset,
    isDraggingSelection,
    selectedTool,
    initialPositions,
    selectedTools,
    setDroppedTools,
    constrainToCanvas // Added this dependency
  ]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      handleResizeEnd();
      return;
    }
    endPan();
    setDragOffset(null);
    setIsDraggingSelection(false);
    setInitialPositions({});
    setSelectionBox(null);
  }, [endPan]);

    // Handle finger cut tool click
  const handleFingerCutClick = useCallback((e: React.MouseEvent) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // Create a new finger cut tool
    const fingerCutTool: DroppedTool = {
      id: `fingercut-${Date.now()}`,
      name: 'Finger Cut',
      icon: '⭕',
      toolBrand: 'FINGERCUT',
      x: canvasPos.x - 25, // Center the finger cut
      y: canvasPos.y - 15,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      width: 50, // Default finger cut width
      length: 30, // Default finger cut length
      thickness: unit === 'mm' ? 12.7 : 0.5,
      unit,
      opacity: 100,
      smooth: 0,
      metadata: {
        isFingerCut: true,
        fingerCutWidth: 50,
        fingerCutLength: 30,
        length: 2.0, // Default size for finger cuts
      },
    };

    // Constrain to canvas boundaries
    const constrainedPos = constrainToCanvas(fingerCutTool, fingerCutTool.x, fingerCutTool.y);
    fingerCutTool.x = constrainedPos.x;
    fingerCutTool.y = constrainedPos.y;

    // Add to dropped tools
    setDroppedTools(prev => [...prev, fingerCutTool]);
    setSelectedTool(fingerCutTool.id);
    setSelectedTools([fingerCutTool.id]);
  }, [activeTool, screenToCanvas, constrainToCanvas, setDroppedTools, setSelectedTool, setSelectedTools, unit]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasContainer = target === canvasContainerRef.current;
    const isCanvas = target === canvasRef.current;

    if ((isCanvasContainer || isCanvas) && !selectionBox?.isSelecting && activeTool === 'cursor') {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedTools([]);
        setSelectedTool(null);
      }
    }
    // Handle finger cut tool click
    else if (activeTool === 'fingercut') {
      handleFingerCutClick(e);
    }
  }, [selectionBox, activeTool, setSelectedTool, setSelectedTools, handleFingerCutClick]);

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

  // Auto-fix overlaps function
  const autoFixOverlaps = useCallback(() => {
    const toolsToFix = droppedTools.filter(tool => overlappingTools.includes(tool.id));

    setDroppedTools(prev => {
      const newTools = [...prev];
      const processedIds = new Set<string>();

      toolsToFix.forEach(tool => {
        if (!processedIds.has(tool.id)) {
          const otherTools = newTools.filter(t => t.id !== tool.id);
          const nonOverlappingPos = findNonOverlappingPosition(tool, otherTools);

          const toolIndex = newTools.findIndex(t => t.id === tool.id);
          if (toolIndex !== -1) {
            newTools[toolIndex] = {
              ...newTools[toolIndex],
              x: nonOverlappingPos.x,
              y: nonOverlappingPos.y
            };
          }
          processedIds.add(tool.id);
        }
      });

      return newTools;
    });
  }, [droppedTools, overlappingTools, findNonOverlappingPosition, setDroppedTools]);

  // Style helpers
  const getCanvasCursor = useCallback(() => {
    if (isPanning) return 'grabbing';
    if (isDraggingSelection) return 'grabbing';
    switch (activeTool) {
      case 'cursor': return 'default';
      case 'hand': return 'grab';
      case 'box': return 'crosshair';
      default: return 'default';
    }
  }, [activeTool, isPanning, isDraggingSelection]);

  const getToolCursor = useCallback((toolId: string) => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (activeTool === 'cursor') {
      if (isDraggingSelection && selectedTools.includes(toolId)) return 'grabbing';
      return 'move';
    }
    return 'default';
  }, [activeTool, isDraggingSelection, selectedTools, isPanning]);

  // Fit canvas to view
  const fitToView = useCallback(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerRect = container.getBoundingClientRect();
    const canvasStyle = getCanvasStyle();
    const canvasWidth = parseInt(canvasStyle.width);
    const canvasHeight = parseInt(canvasStyle.height);

    const scaleX = (containerRect.width - 100) / canvasWidth;
    const scaleY = (containerRect.height - 100) / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (containerRect.width - canvasWidth * scale) / 2;
    const centerY = (containerRect.height - canvasHeight * scale) / 2;

    setViewport({
      x: centerX,
      y: centerY,
      zoom: scale
    });
  }, [getCanvasStyle]);

  // Center canvas
  const centerCanvas = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasStyle = getCanvasStyle();
    const canvasWidth = parseInt(canvasStyle.width);
    const canvasHeight = parseInt(canvasStyle.height);

    const centerX = (containerRect.width - canvasWidth * viewport.zoom) / 2;
    const centerY = (containerRect.height - canvasHeight * viewport.zoom) / 2;

    setViewport(prev => ({
      ...prev,
      x: centerX,
      y: centerY
    }));
  }, [getCanvasStyle, viewport.zoom]);



  return {
    // Refs
    canvasRef,
    canvasContainerRef,

    // State
    dragOffset,
    selectionBox,
    viewport,
    hasOverlaps,
    overlappingTools,

    // Utility functions
    getToolDimensions,
    getShadowOffset,
    getCanvasStyle,
    getViewportTransform,
    findNonOverlappingPosition,
    constrainToCanvas, // Added this new function to exports

    // Event handlers
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleDeleteTool,
    handleDeleteSelectedTools,
    handleFingerCutClick,
    autoFixOverlaps,

    // Style helpers
    getCanvasCursor,
    getToolCursor,

    // Viewport controls
    fitToView,
    centerCanvas,
  };
};