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
  const [windowDimensions, setWindowDimensions] = useState({ width: 1200, height: 800 });

  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo([]);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState<number>(600); // Canvas width
  const [canvasLength, setCanvasLength] = useState<number>(400); // Canvas length (height)
  const [unit, setUnit] = useState<'mm' | 'inches'>('mm');

  // Default values for new tools when dropped
  const [defaultToolWidth, setDefaultToolWidth] = useState<number>(50);
  const [defaultToolLength, setDefaultToolLength] = useState<number>(100);
  const [defaultToolThickness, setDefaultToolThickness] = useState<number>(5);

  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box'>('cursor');

  // Window dimensions management
  useEffect(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate available space for canvas
  const getAvailableSpace = () => {
    const SIDEBAR_WIDTH = 320;
    const MAIN_PADDING = 48;
    const BUFFER = 60;

    return {
      width: Math.max(200, windowDimensions.width - SIDEBAR_WIDTH - MAIN_PADDING - BUFFER),
      height: Math.max(200, windowDimensions.height - 290)
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

  // Handle unit change - converts canvas dimensions and all tool dimensions
  const handleUnitChange = useCallback((newUnit: 'mm' | 'inches') => {
    if (newUnit !== unit) {
      // Convert canvas dimensions
      const convertedCanvasWidth = parseFloat(convertValue(canvasWidth, unit, newUnit).toFixed(3));
      const convertedCanvasLength = parseFloat(convertValue(canvasLength, unit, newUnit).toFixed(3));
      
      // Convert default tool values
      const convertedDefaultToolWidth = parseFloat(convertValue(defaultToolWidth, unit, newUnit).toFixed(3));
      const convertedDefaultToolLength = parseFloat(convertValue(defaultToolLength, unit, newUnit).toFixed(3));
      const convertedDefaultToolThickness = parseFloat(convertValue(defaultToolThickness, unit, newUnit).toFixed(3));

      // Convert all existing tools
      const convertedTools = droppedTools.map(tool => ({
        ...tool,
        width: parseFloat(convertValue(tool.width, tool.unit, newUnit).toFixed(3)),
        length: parseFloat(convertValue(tool.length, tool.unit, newUnit).toFixed(3)),
        thickness: parseFloat(convertValue(tool.thickness, tool.unit, newUnit).toFixed(3)),
        unit: newUnit
      }));

      // Update all values
      setCanvasWidth(convertedCanvasWidth);
      setCanvasLength(convertedCanvasLength);
      setDefaultToolWidth(convertedDefaultToolWidth);
      setDefaultToolLength(convertedDefaultToolLength);
      setDefaultToolThickness(convertedDefaultToolThickness);
      setUnit(newUnit);
      setDroppedTools(convertedTools);
    }
  }, [unit, canvasWidth, canvasLength, defaultToolWidth, defaultToolLength, defaultToolThickness, droppedTools]);

  // Update dropped tools with undo/redo support
  const updateDroppedTools = useCallback((updater: React.SetStateAction<DroppedTool[]>) => {
    setDroppedTools(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      pushState(newState);
      return newState;
    });
  }, [pushState]);

  const handleUndo = useCallback(() => {
    const undoneState = undo();
    if (undoneState) {
      setDroppedTools(undoneState);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const redoneState = redo();
    if (redoneState) {
      setDroppedTools(redoneState);
    }
  }, [redo]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <ControlBar
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasLength={canvasLength}
        setCanvasLength={setCanvasLength}
        unit={unit}
        setUnit={handleUnitChange}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        windowDimensions={windowDimensions}
      />
      <OptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={updateDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          defaultWidth={defaultToolWidth}
          defaultLength={defaultToolLength}
          defaultThickness={defaultToolThickness}
          unit={unit}
          activeTool={activeTool}
          canvasWidth={canvasWidth}
          canvasLength={canvasLength}
          availableSpace={getAvailableSpace()}
        />
        <Sidebar
          droppedTools={droppedTools}
          selectedTool={selectedTool}
          activeTool={activeTool}
          setDroppedTools={updateDroppedTools}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          canvasHeight={canvasLength}
        />
      </div>
    </div>
  );
}

export default DesignLayout;