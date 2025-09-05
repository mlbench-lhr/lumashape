'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ControlBarProps {
  width: number;
  setWidth: (width: number) => void;
  length: number;
  setLength: (length: number) => void;
  thickness: number;
  setThickness: (thickness: number) => void;
  unit: 'mm' | 'inches';
  setUnit: (unit: 'mm' | 'inches') => void;
  maxWidth?: number;
  maxHeight?: number;
  activeTool: 'cursor' | 'hand' | 'box';
  setActiveTool: (tool: 'cursor' | 'hand' | 'box') => void;
  selectedToolId?: string | null;
}

const ControlBar: React.FC<ControlBarProps> = ({
  width,
  setWidth,
  length,
  setLength,
  thickness,
  setThickness,
  unit,
  setUnit,
  activeTool,
  setActiveTool,
}) => {
  const [hasLoadedFromSession, setHasLoadedFromSession] = useState(false);

  // Load initial values from sessionStorage only once on first load
  // Load initial values from sessionStorage only once on first load
  useEffect(() => {
    if (!hasLoadedFromSession) {
      const savedData = sessionStorage.getItem('layoutForm');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);

          // ✅ load exactly what was saved
          if (parsed.units && (parsed.units === 'mm' || parsed.units === 'inches')) {
            setUnit(parsed.units);
          }

          if (parsed.width !== undefined && !isNaN(Number(parsed.width))) {
            setWidth(Number(parsed.width));
          }

          if (parsed.length !== undefined && !isNaN(Number(parsed.length))) {
            setLength(Number(parsed.length));
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
  }, [hasLoadedFromSession, setWidth, setLength, setThickness, setUnit]);


  // ✅ No constraints anymore
  const handleLengthChange = (value: number) => {
    setLength(value);
  };

  const handleWidthChange = (value: number) => {
    setWidth(value);
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

        {/* Length */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Length:</label>
          <input
            type="number"
            value={length}
            onChange={(e) => handleLengthChange(Number(e.target.value))}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm inline-block w-12">{unit}</span>
        </div>

        {/* Width */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Width:</label>
          <input
            type="number"
            value={width}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm inline-block w-12">{unit}</span>
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

        {/* Thickness */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Thickness</label>
          <select
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="bg-white text-gray-900 px-2 py-1 w-32 rounded text-sm border-0 focus:ring-2 focus:ring-blue-400"
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
      </div>
    </div>
  );
};

export default ControlBar;
