"use client";
import React, { useState, useCallback, useEffect } from "react";
import Header from "./Header";
import ControlBar from "./ControlBar";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import { DroppedTool, Tool } from "./types";
import { useUndoRedo } from './toolUtils';

function DesignLayout({
  initialDroppedTools,
  initialCanvas,
  editingLayoutId,
  readOnly,
}: {
  initialDroppedTools?: DroppedTool[];
  initialCanvas?: { width: number; height: number; unit: 'mm' | 'inches'; thickness: number };
  editingLayoutId?: string;
  readOnly?: boolean;
}) {
  // Seed with initial values if provided
  const [droppedTools, setDroppedTools] = useState<DroppedTool[]>(initialDroppedTools || []);
  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialDroppedTools || []);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Canvas dimensions (controlled by ControlBar)
  const [canvasWidth, setCanvasWidth] = useState<number>(initialCanvas?.width ?? 400);
  const [canvasHeight, setCanvasHeight] = useState<number>(initialCanvas?.height ?? 300);
  const [thickness, setThickness] = useState<number>(initialCanvas?.thickness ?? 12.7);
  const [unit, setUnit] = useState<'mm' | 'inches'>(initialCanvas?.unit ?? 'mm');

  useEffect(() => {
    if (editingLayoutId) {
      try { sessionStorage.setItem('editingLayoutId', editingLayoutId); } catch { }
    }
    if (initialDroppedTools && initialDroppedTools.length) {
      pushState(initialDroppedTools);
    }
  }, [editingLayoutId, initialDroppedTools, pushState]);

  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box' | 'fingercut'>('cursor');

  // State for overlap detection (passed from Canvas)
  const [hasOverlaps, setHasOverlaps] = useState<boolean>(false);

  // Unit conversion helper
  const convertValue = (
    value: number,
    from: 'mm' | 'inches',
    to: 'mm' | 'inches'
  ): number => {
    if (from === to) return value;
    return from === 'mm' && to === 'inches'
      ? value / 25.4
      : value * 25.4;
  };

  // Handle unit change - converts canvas dimensions and tool thicknesses
  const handleUnitChange = useCallback((newUnit: 'mm' | 'inches') => {
    if (newUnit === unit) return;

    // Convert canvas dimensions
    const convertedCanvasWidth = parseFloat(convertValue(canvasWidth, unit, newUnit).toFixed(3));
    const convertedCanvasHeight = parseFloat(convertValue(canvasHeight, unit, newUnit).toFixed(3));
    const convertedThickness = parseFloat(convertValue(thickness, unit, newUnit).toFixed(3));

    // Convert width/length/real dims only. Depth remains inches, unchanged.
    const convertedTools = droppedTools.map(tool => {
      const convertedWidth =
        typeof tool.width === 'number'
          ? parseFloat(convertValue(tool.width, tool.unit, newUnit).toFixed(3))
          : tool.width;

      const convertedLength =
        typeof tool.length === 'number'
          ? parseFloat(convertValue(tool.length, tool.unit, newUnit).toFixed(3))
          : tool.length;

      const convertedRealWidth =
        typeof tool.realWidth === 'number'
          ? parseFloat(convertValue(tool.realWidth, tool.unit, newUnit).toFixed(3))
          : tool.realWidth;

      const convertedRealHeight =
        typeof tool.realHeight === 'number'
          ? parseFloat(convertValue(tool.realHeight, tool.unit, newUnit).toFixed(3))
          : tool.realHeight;

      const convertedToolDepth = parseFloat(
        convertValue(tool.depth, tool.unit, newUnit).toFixed(3)
      );

      // Leave metadata.length as inches; it's used as inches in rendering logic
      return {
        ...tool,
        width: convertedWidth,
        length: convertedLength,
        realWidth: convertedRealWidth,
        realHeight: convertedRealHeight,
        depth: tool.depth, // keep inches, do not convert
        unit: newUnit,
      };
    });

    // Update all values
    setCanvasWidth(convertedCanvasWidth);
    setCanvasHeight(convertedCanvasHeight);
    setThickness(convertedThickness);
    setUnit(newUnit);
    setDroppedTools(convertedTools);
  }, [unit, canvasWidth, canvasHeight, thickness, droppedTools]);

  // Update dropped tools with history tracking
  const updateDroppedTools = useCallback((updater: React.SetStateAction<DroppedTool[]>) => {
    setDroppedTools(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      pushState(newState); // Add to history immediately
      return newState;
    });
  }, [pushState]);

  // Clear selection when selectedTool is cleared
  useEffect(() => {
    const firstSelected = selectedTools[0] || null;
    if (selectedTool !== firstSelected) {
      setSelectedTool(firstSelected);
    }
  }, [selectedTools]);


  // Keep selectedTool in sync with selectedTools
  useEffect(() => {
    if (selectedTool && !selectedTools.includes(selectedTool)) {
      setSelectedTool(selectedTools[0] || null);
    }
  }, [selectedTool, selectedTools]);

  const handleUndo = useCallback(() => {
    const undoneState = undo();
    if (undoneState) {
      setDroppedTools(undoneState);
      // Clear selections since the state has changed
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const redoneState = redo();
    if (redoneState) {
      setDroppedTools(redoneState);
      // Clear selections since the state has changed
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [redo]);

  // Handle successful save
  const handleSaveLayout = useCallback(() => {
    // Clear the layout state after successful save
    setDroppedTools([]);
    setSelectedTool(null);
    setSelectedTools([]);

    // Optionally show success message or redirect
    console.log('Layout saved successfully!');
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <Header
        droppedTools={droppedTools}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        thickness={thickness}
        unit={unit}
        hasOverlaps={hasOverlaps}
        onSaveLayout={handleSaveLayout}
        readOnly={readOnly}
      />
      <ControlBar
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasHeight={canvasHeight}
        setCanvasHeight={setCanvasHeight}
        thickness={thickness}
        setThickness={setThickness}
        unit={unit}
        setUnit={handleUnitChange}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedToolId={selectedTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        readOnly={readOnly}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={updateDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          selectedTools={selectedTools}
          setSelectedTools={setSelectedTools}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          unit={unit}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onOverlapChange={setHasOverlaps}
          readOnly={readOnly}
        />
        <div className="w-80 flex-shrink-0">
          <Sidebar
            droppedTools={droppedTools}
            selectedTool={selectedTool}
            selectedTools={selectedTools}
            activeTool={activeTool}
            setDroppedTools={updateDroppedTools}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            unit={unit}
            setActiveTool={setActiveTool}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

export default DesignLayout;