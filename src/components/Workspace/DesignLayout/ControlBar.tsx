'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ControlBarProps {
  canvasWidth: number;
  setCanvasWidth: (width: number) => void;
  canvasHeight: number;
  setCanvasHeight: (height: number) => void;
  thickness: number;
  setThickness: (thickness: number) => void;
  unit: 'mm' | 'inches';
  setUnit: (unit: 'mm' | 'inches') => void;
  activeTool: 'cursor' | 'hand' | 'box' | 'fingercut';
  setActiveTool: (tool: 'cursor' | 'hand' | 'box' | 'fingercut') => void;
  selectedToolId?: string | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  readOnly?: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  thickness,
  setThickness,
  unit,
  setUnit,
  activeTool,
  setActiveTool,
  canUndo = false,
  canRedo = false,
  onUndo = () => { },
  onRedo = () => { },
  readOnly = false,
}) => {
  const [hasLoadedFromSession, setHasLoadedFromSession] = useState(false);

  // Load initial values from sessionStorage only once on first load
  useEffect(() => {
    if (!hasLoadedFromSession) {
      const savedData = sessionStorage.getItem('layoutForm');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);

          // Load units first
          if (parsed.units && (parsed.units === 'mm' || parsed.units === 'inches')) {
            setUnit(parsed.units);
          }

          // Load canvas dimensions - map from width/length to canvasWidth/canvasHeight
          if (parsed.width !== undefined && !isNaN(Number(parsed.width))) {
            setCanvasWidth(Number(parsed.width));
          }

          if (parsed.length !== undefined && !isNaN(Number(parsed.length))) {
            setCanvasHeight(Number(parsed.length));
          }

          // Also check for existing canvasWidth/canvasHeight (for when returning from design layout)
          if (parsed.canvasWidth !== undefined && !isNaN(Number(parsed.canvasWidth))) {
            setCanvasWidth(Number(parsed.canvasWidth));
          }

          if (parsed.canvasHeight !== undefined && !isNaN(Number(parsed.canvasHeight))) {
            setCanvasHeight(Number(parsed.canvasHeight));
          }

          if (parsed.thickness !== undefined && !isNaN(Number(parsed.thickness))) {
            setThickness(Number(parsed.thickness));
          }
        } catch (error) {
          console.error('Error parsing sessionStorage data:', error);
        }
      }
      setHasLoadedFromSession(true);
    }
  }, [hasLoadedFromSession, setCanvasWidth, setCanvasHeight, setThickness, setUnit]);

  // Save to sessionStorage whenever values change
  useEffect(() => {
    if (hasLoadedFromSession) {
      const savedData = sessionStorage.getItem('layoutForm');
      let existingData = {};

      if (savedData) {
        try {
          existingData = JSON.parse(savedData);
        } catch (error) {
          console.error('Error parsing existing sessionStorage data:', error);
        }
      }

      const dataToSave = {
        ...existingData,
        units: unit,
        width: canvasWidth, // Keep original width field
        length: canvasHeight, // Keep original length field  
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        thickness: thickness
      };
      sessionStorage.setItem('layoutForm', JSON.stringify(dataToSave));
    }
  }, [hasLoadedFromSession, unit, canvasWidth, canvasHeight, thickness]);

  const MAX_INCHES = 72;
  const MAX_MM = 1828.8;

  const handleHeightChange = (value: number) => {
    const max = unit === "inches" ? MAX_INCHES : MAX_MM;
    if (value > 0 && value <= max) {
      setCanvasHeight(value);
    }
  };

  const handleWidthChange = (value: number) => {
    const max = unit === "inches" ? MAX_INCHES : MAX_MM;
    if (value > 0 && value <= max) {
      setCanvasWidth(value);
    }
  };


  return (
    <div className="bg-primary text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-11">
        {/* Unit Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'mm' | 'inches')}
            disabled={readOnly}
            className="bg-white text-gray-900 w-28 py-1 rounded text-sm border-0 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          >
            <option value="mm">mm</option>
            <option value="inches">inches</option>
          </select>
        </div>

        {/* Canvas Height */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Height:</label>
          <input
            type="number"
            value={canvasHeight}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            disabled={readOnly}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          />
          <span className="text-sm inline-block w-12">{unit}</span>
        </div>

        {/* Canvas Width */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Width:</label>
          <input
            type="number"
            value={canvasWidth}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            disabled={readOnly}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          />
          <span className="text-sm inline-block w-12">{unit}</span>
        </div>

        {/* Undo/Redo Controls */}
        {!readOnly && (
          <div className="flex items-center space-x-1">
            <button
              className={`p-1 rounded transition-colors ${canUndo
                ? 'hover:bg-blue-500 cursor-pointer'
                : 'cursor-not-allowed opacity-50'
                }`}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Image
                src={"/images/workspace/undo.svg"}
                alt="Undo"
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </button>
            <button
              className={`p-1 rounded transition-colors ${canRedo
                ? 'hover:bg-blue-500 cursor-pointer'
                : 'cursor-not-allowed opacity-50'
                }`}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Image
                src={"/images/workspace/redo.svg"}
                alt="Redo"
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        )}

        {/* Tools */}
        {!readOnly && (
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
        )}

        {/* Thickness */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Thickness</label>
          <select
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            disabled={readOnly}
            className="bg-white text-gray-900 px-2 py-1 w-32 rounded text-sm border-0 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
          >
            <option value={1.25}>1.250 inches</option>
            <option value={2}>2.000 inches</option>
            <option value={2.5}>2.500 inches</option>
            <option value={3}>3.000 inches</option>
          </select>

        </div>
      </div>
    </div>
  );
};

export default ControlBar;