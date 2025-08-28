'use client';
import React from 'react';
import Image from 'next/image';

interface ControlBarProps {
  canvasWidth: number;
  setCanvasWidth: (width: number) => void;
  canvasLength: number;
  setCanvasLength: (length: number) => void;
  unit: 'mm' | 'inches';
  setUnit: (unit: 'mm' | 'inches') => void;
  activeTool: 'cursor' | 'hand' | 'box';
  setActiveTool: (tool: 'cursor' | 'hand' | 'box') => void;
  windowDimensions: { width: number; height: number };
}

const ControlBar: React.FC<ControlBarProps> = ({
  canvasWidth,
  setCanvasWidth,
  canvasLength,
  setCanvasLength,
  unit,
  setUnit,
  activeTool,
  setActiveTool,
  windowDimensions,
}) => {

  // Calculate max dimensions based on available screen space
  const getMaxDimensions = () => {
    const SIDEBAR_WIDTH = 320; // w-80 = 320px
    const MAIN_PADDING = 48; // p-6 = 24px on each side = 48px total
    const BUFFER = 60; // Safety buffer
    const CANVAS_MARGIN = 20; // Additional margin used in Canvas.tsx constrainedWidth calculation

    // Calculate actual available space (same as Canvas.tsx)
    const availableWidth = Math.max(200, windowDimensions.width - SIDEBAR_WIDTH - MAIN_PADDING - BUFFER);
    const availableHeight = Math.max(200, windowDimensions.height - 290);

    // Account for the canvas margin that gets subtracted in Canvas.tsx
    const usableWidth = availableWidth - CANVAS_MARGIN;
    const usableHeight = availableHeight - 40; // Extra margin from Canvas.tsx

    const getLogicalSize = (pixels: number, unit: 'mm' | 'inches') => {
      if (unit === 'mm') {
        return pixels / 3.5; // More realistic scaling: ~3.5px per mm
      } else {
        return pixels / 90; // More realistic scaling: ~90px per inch
      }
    };

    return {
      maxWidth: Math.floor(getLogicalSize(usableWidth, unit) * 10) / 10, // Round down to 1 decimal
      maxHeight: Math.floor(getLogicalSize(usableHeight, unit) * 10) / 10 // Round down to 1 decimal
    };
  };

  const { maxWidth, maxHeight } = getMaxDimensions();

  const handleLengthChange = (value: number) => {
    const constrainedValue = Math.min(Math.max(0.1, value), maxHeight);
    setCanvasLength(constrainedValue);
  };

  const handleWidthChange = (value: number) => {
    const constrainedValue = Math.min(Math.max(0.1, value), maxWidth);
    setCanvasWidth(constrainedValue);
  };

  return (
    <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        {/* Unit Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'mm' | 'inches')}
            className="bg-white text-gray-900 w-28 py-1 rounded text-sm border-0 focus:ring-2 focus:ring-blue-400"
          >
            <option value="mm">mm</option>
            <option value="inches">inches</option>
          </select>
        </div>

        {/* Canvas Length */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Canvas Length:</label>
          <input
            type="number"
            value={canvasLength}
            onChange={(e) => handleLengthChange(Number(e.target.value))}
            min="0.1"
            max={maxHeight}
            step="0.1"
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm">{unit}</span>
          <span className="text-xs text-gray-400">
            (max: {maxWidth.toFixed(1)})
          </span>
        </div>

        {/* Canvas Width */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Canvas Width:</label>
          <input
            type="number"
            value={canvasWidth}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            min="0.1"
            max={maxWidth}
            step="0.1"
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm">{unit}</span>
          <span className="text-xs text-gray-400">
            (max: {maxWidth.toFixed(1)})
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-1">
          <button
            className={`p-1 rounded ${activeTool === 'cursor' ? 'bg-blue-500' : 'hover:bg-blue-500'}`}
            onClick={() => setActiveTool('cursor')}
          >
            <Image
              src={"/images/workspace/cursor.svg"}
              alt="Cursor"
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          </button>
          <button
            className={`p-1 rounded ${activeTool === 'hand' ? 'bg-blue-500' : 'hover:bg-blue-500'}`}
            onClick={() => setActiveTool('hand')}
          >
            <Image
              src={"/images/workspace/hand.svg"}
              alt="Hand"
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          </button>
        </div>

        {/* Thickness - display only, no functionality */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Thickness</label>
          <select
            defaultValue={12.7}
            className="bg-white text-gray-900 px-2 py-1 w-32 rounded text-sm border-0 focus:ring-2 focus:ring-blue-400"
            onChange={() => { }} // Do nothing when changed
          >
            {unit === 'inches' ? (
              <>
                <option value={0.5}>0.500 inches</option>
                <option value={1}>1.000 inches</option>
                <option value={1.5}>1.500 inches</option>
              </>
            ) : (
              <>
                <option value={12.7}>12.7 mm</option>
                <option value={25.4}>25.4 mm</option>
                <option value={38.1}>38.1 mm</option>
              </>
            )}
          </select>
        </div>

        {/* Debug info - shows the actual calculations */}
        <div className="text-xs text-gray-300">
          Screen: {windowDimensions.width}x{windowDimensions.height} | 
          Usable: {Math.max(200, windowDimensions.width - 320 - 48 - 60 - 20)}px |
          Max: {maxWidth.toFixed(1)} {unit}
        </div>
      </div>
    </div>
  );
};

export default ControlBar;