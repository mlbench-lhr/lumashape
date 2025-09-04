"use client";
import React, { useState, useCallback, useEffect } from "react";
import Header from "./Header";
import ControlBar from "./ControlBar";
import OptionsBar from "./OptionsBar";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import { DroppedTool, Tool } from "./types";
import { useUndoRedo } from './useUndoRedo';

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

  // Global default values for new tools
  const [defaultLength, setDefaultLength] = useState<number>(24);
  const [defaultWidth, setDefaultWidth] = useState<number>(24);
  const [defaultThickness, setDefaultThickness] = useState<number>(12.7);
  const [unit, setUnit] = useState<'mm' | 'inches'>('mm');

  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box'>('cursor');

  // State for canvas constraints
  const [canvasConstraints, setCanvasConstraints] = useState({
    maxWidth: Infinity,
    maxHeight: Infinity,
    unit: 'mm' as 'mm' | 'inches'
  });

  // Get the currently selected tool's dimensions, or defaults if none selected
  const getSelectedToolDimensions = () => {
    if (!selectedTool) {
      return {
        width: defaultWidth,
        length: defaultLength,
        thickness: defaultThickness,
        unit: unit
      };
    }

    const tool = droppedTools.find(t => t.id === selectedTool);
    if (tool) {
      return {
        width: tool.width,
        length: tool.length,
        thickness: tool.thickness,
        unit: tool.unit
      };
    }

    return {
      width: defaultWidth,
      length: defaultLength,
      thickness: defaultThickness,
      unit: unit
    };
  };

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

  // Handle canvas dimension updates - memoized to prevent infinite loops
  const handleCanvasDimensionsChange = useCallback((dimensions: {
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
    unit: 'mm' | 'inches';
  }) => {
    setCanvasConstraints({
      maxWidth: dimensions.maxWidth,
      maxHeight: dimensions.maxHeight,
      unit: dimensions.unit
    });
  }, []);

  // Handle unit change - converts all tools and defaults
  const handleUnitChange = useCallback((newUnit: 'mm' | 'inches') => {
    if (newUnit !== unit) {
      // Convert default values
      const convertedDefaultLength = parseFloat(convertValue(defaultLength, unit, newUnit).toFixed(3));
      const convertedDefaultWidth = parseFloat(convertValue(defaultWidth, unit, newUnit).toFixed(3));
      const convertedDefaultThickness = parseFloat(convertValue(defaultThickness, unit, newUnit).toFixed(3));

      // Convert all existing tools
      const convertedTools = droppedTools.map(tool => ({
        ...tool,
        width: parseFloat(convertValue(tool.width, tool.unit, newUnit).toFixed(3)),
        length: parseFloat(convertValue(tool.length, tool.unit, newUnit).toFixed(3)),
        thickness: parseFloat(convertValue(tool.thickness, tool.unit, newUnit).toFixed(3)),
        unit: newUnit
      }));

      // Convert canvas constraints to new unit
      const convertedMaxWidth = canvasConstraints.maxWidth !== Infinity
        ? parseFloat(convertValue(canvasConstraints.maxWidth, canvasConstraints.unit, newUnit).toFixed(3))
        : Infinity;
      const convertedMaxHeight = canvasConstraints.maxHeight !== Infinity
        ? parseFloat(convertValue(canvasConstraints.maxHeight, canvasConstraints.unit, newUnit).toFixed(3))
        : Infinity;

      // Update all values
      setDefaultLength(convertedDefaultLength);
      setDefaultWidth(convertedDefaultWidth);
      setDefaultThickness(convertedDefaultThickness);
      setUnit(newUnit);
      setDroppedTools(convertedTools);

      // Update canvas constraints to new unit
      setCanvasConstraints({
        maxWidth: convertedMaxWidth,
        maxHeight: convertedMaxHeight,
        unit: newUnit
      });
    }
  }, [unit, defaultLength, defaultWidth, defaultThickness, droppedTools, canvasConstraints]);

  // Update dimensions for selected tool or defaults
  const updateDroppedTools = useCallback((updater: React.SetStateAction<DroppedTool[]>) => {
    setDroppedTools(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      pushState(newState); // Add to history immediately
      return newState;
    });
  }, [pushState]);

  // Update the dimension update functions to use the correct state:
  const updateWidth = useCallback((newWidth: number) => {
    const constrainedWidth = Math.min(newWidth, canvasConstraints.maxWidth);
    const finalWidth = Math.max(0.1, constrainedWidth);

    if (selectedTool && selectedTools.length === 1) {
      // Update single selected tool
      updateDroppedTools(prev => prev.map(tool =>
        tool.id === selectedTool
          ? { ...tool, width: finalWidth }
          : tool
      ));
    } else if (selectedTools.length > 1) {
      // Update all selected tools
      updateDroppedTools(prev => prev.map(tool =>
        selectedTools.includes(tool.id)
          ? { ...tool, width: finalWidth }
          : tool
      ));
    } else {
      // Update default width
      setDefaultWidth(finalWidth);
    }
  }, [selectedTool, selectedTools, canvasConstraints.maxWidth, updateDroppedTools]);

  const updateLength = useCallback((newLength: number) => {
    const constrainedLength = Math.min(newLength, canvasConstraints.maxHeight);
    const finalLength = Math.max(0.1, constrainedLength);

    if (selectedTool && selectedTools.length === 1) {
      // Update single selected tool
      updateDroppedTools(prev => prev.map(tool =>
        tool.id === selectedTool
          ? { ...tool, length: finalLength }
          : tool
      ));
    } else if (selectedTools.length > 1) {
      // Update all selected tools
      updateDroppedTools(prev => prev.map(tool =>
        selectedTools.includes(tool.id)
          ? { ...tool, length: finalLength }
          : tool
      ));
    } else {
      // Update default length
      setDefaultLength(finalLength);
    }
  }, [selectedTool, selectedTools, canvasConstraints.maxHeight, updateDroppedTools]);

  const updateThickness = useCallback((newThickness: number) => {
    const finalThickness = Math.max(0.1, newThickness);

    if (selectedTool && selectedTools.length === 1) {
      // Update single selected tool
      updateDroppedTools(prev => prev.map(tool =>
        tool.id === selectedTool
          ? { ...tool, thickness: finalThickness }
          : tool
      ));
    } else if (selectedTools.length > 1) {
      // Update all selected tools
      updateDroppedTools(prev => prev.map(tool =>
        selectedTools.includes(tool.id)
          ? { ...tool, thickness: finalThickness }
          : tool
      ));
    } else {
      // Update default thickness
      setDefaultThickness(finalThickness);
    }
  }, [selectedTool, selectedTools, updateDroppedTools]);

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

  const currentDimensions = getSelectedToolDimensions();

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

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <ControlBar
        width={currentDimensions.width}
        setWidth={updateWidth}
        length={currentDimensions.length}
        setLength={updateLength}
        thickness={currentDimensions.thickness}
        setThickness={updateThickness}
        unit={unit}
        setUnit={handleUnitChange}
        maxWidth={canvasConstraints.maxWidth}
        maxHeight={canvasConstraints.maxHeight}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedToolId={selectedTool}
        selectedToolsCount={selectedTools.length} // Add count for multi-select context
      />
      <OptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={updateDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          selectedTools={selectedTools}
          setSelectedTools={setSelectedTools}
          defaultWidth={defaultWidth}
          defaultLength={defaultLength}
          defaultThickness={defaultThickness}
          unit={unit}
          onCanvasDimensionsChange={handleCanvasDimensionsChange}
          activeTool={activeTool}
        />
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
  );
}

export default DesignLayout;