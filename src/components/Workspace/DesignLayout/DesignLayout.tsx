"use client";
import React, { useState, useCallback, useEffect } from "react";
import Header from "./Header";
import ControlBar from "./ControlBar";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import { DroppedTool, Tool } from "./types";
import { useUndoRedo } from './toolUtils';

function DesignLayout() {
  const [droppedTools, setDroppedTools] = useState<DroppedTool[]>([]);
  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo([]);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Canvas dimensions (controlled by ControlBar)
  const [canvasWidth, setCanvasWidth] = useState<number>(400);
  const [canvasHeight, setCanvasHeight] = useState<number>(300);
  const [thickness, setThickness] = useState<number>(12.7);
  const [unit, setUnit] = useState<'mm' | 'inches'>('mm');

  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box'>('cursor');

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
    if (newUnit !== unit) {
      // Convert canvas dimensions
      const convertedCanvasWidth = parseFloat(convertValue(canvasWidth, unit, newUnit).toFixed(3));
      const convertedCanvasHeight = parseFloat(convertValue(canvasHeight, unit, newUnit).toFixed(3));
      const convertedThickness = parseFloat(convertValue(thickness, unit, newUnit).toFixed(3));

      // Convert all existing tools' thickness (they keep fixed visual size)
      const convertedTools = droppedTools.map(tool => ({
        ...tool,
        thickness: parseFloat(convertValue(tool.thickness, tool.unit, newUnit).toFixed(3)),
        unit: newUnit
      }));

      // Update all values
      setCanvasWidth(convertedCanvasWidth);
      setCanvasHeight(convertedCanvasHeight);
      setThickness(convertedThickness);
      setUnit(newUnit);
      setDroppedTools(convertedTools);
    }
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
    if (!selectedTool && selectedTools.length > 0) {
      setSelectedTools([]);
    }
  }, [selectedTool, selectedTools.length]);

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
    <div className="h-screen flex flex-col bg-gray-100">
      <Header 
        droppedTools={droppedTools}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        thickness={thickness}
        unit={unit}
        hasOverlaps={hasOverlaps}
        onSaveLayout={handleSaveLayout}
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
          onOverlapChange={setHasOverlaps} // Add this prop to track overlaps
        />
        <div className="w-80 flex-shrink-0">
          <Sidebar
            droppedTools={droppedTools}
            selectedTool={selectedTool}
            selectedTools={selectedTools}
            activeTool={activeTool}
            setDroppedTools={updateDroppedTools}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>
    </div>
  );
}

export default DesignLayout;