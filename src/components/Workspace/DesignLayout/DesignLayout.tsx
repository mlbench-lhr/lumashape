"use client";
import React, { useState, useCallback } from "react";
import Header from "./Header";
import ControlBar from "./ControlBar";
import OptionsBar from "./OptionsBar";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import { DroppedTool, Tool } from "./types";

function DesignLayout() {
  const [droppedTools, setDroppedTools] = useState<DroppedTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [length, setLength] = useState<number>(24); // store as number only
  const [width, setWidth] = useState<number>(24);
  const [thickness, setThickness] = useState<number>(12.7); // default 0.5 inch in mm
  const [unit, setUnit] = useState<'mm' | 'inches'>('mm');
  
  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box'>('cursor');
  
  // State for canvas constraints
  const [canvasConstraints, setCanvasConstraints] = useState({
    maxWidth: Infinity,
    maxHeight: Infinity,
    unit: 'mm' as 'mm' | 'inches'
  });

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
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Handle unit change - this will update canvas constraints too
  const handleUnitChange = useCallback((newUnit: 'mm' | 'inches') => {
    if (newUnit !== unit) {
      // Convert current dimension values
      const convertedLength = parseFloat(convertValue(length, unit, newUnit).toFixed(3));
      const convertedWidth = parseFloat(convertValue(width, unit, newUnit).toFixed(3));
      const convertedThickness = parseFloat(convertValue(thickness, unit, newUnit).toFixed(3));

      // Convert canvas constraints to new unit
      const convertedMaxWidth = canvasConstraints.maxWidth !== Infinity 
        ? parseFloat(convertValue(canvasConstraints.maxWidth, canvasConstraints.unit, newUnit).toFixed(3))
        : Infinity;
      const convertedMaxHeight = canvasConstraints.maxHeight !== Infinity 
        ? parseFloat(convertValue(canvasConstraints.maxHeight, canvasConstraints.unit, newUnit).toFixed(3))
        : Infinity;

      // Update all values
      setLength(convertedLength);
      setWidth(convertedWidth);
      setThickness(convertedThickness);
      setUnit(newUnit);

      // Update canvas constraints to new unit
      setCanvasConstraints({
        maxWidth: convertedMaxWidth,
        maxHeight: convertedMaxHeight,
        unit: newUnit
      });
    }
  }, [unit, length, width, thickness, canvasConstraints]);

  // Constrained setters for width and length - memoized to prevent recreations
  const setConstrainedWidth = useCallback((newWidth: number) => {
    const constrainedWidth = Math.min(newWidth, canvasConstraints.maxWidth);
    setWidth(Math.max(0.1, constrainedWidth)); // Ensure minimum value of 0.1
  }, [canvasConstraints.maxWidth]);

  const setConstrainedLength = useCallback((newLength: number) => {
    const constrainedLength = Math.min(newLength, canvasConstraints.maxHeight);
    setLength(Math.max(0.1, constrainedLength)); // Ensure minimum value of 0.1
  }, [canvasConstraints.maxHeight]);

  // Regular thickness setter (no canvas constraint needed) - memoized
  const setConstrainedThickness = useCallback((newThickness: number) => {
    setThickness(Math.max(0.1, newThickness)); // Just ensure minimum value
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <ControlBar
        width={width}
        setWidth={setConstrainedWidth}
        length={length}
        setLength={setConstrainedLength}
        thickness={thickness}
        setThickness={setConstrainedThickness}
        unit={unit}
        setUnit={handleUnitChange} // Use our custom handler instead of setUnit directly
        maxWidth={canvasConstraints.maxWidth}
        maxHeight={canvasConstraints.maxHeight}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
      <OptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={setDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          width={width}
          length={length}
          thickness={thickness}
          unit={unit}
          onCanvasDimensionsChange={handleCanvasDimensionsChange}
          activeTool={activeTool}
        />
        <Sidebar droppedTools={droppedTools} selectedTool={selectedTool} />
      </div>
    </div>
  );
}

export default DesignLayout;