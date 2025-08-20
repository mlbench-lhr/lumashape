'use client';
import React, { useState } from 'react';
import Image from 'next/image';

const ControlBar: React.FC = () => {
  const [unit, setUnit] = useState<'mm' | 'inches'>('mm');
  const [length, setLength] = useState<number>(24); // store as number only
  const [width, setWidth] = useState<number>(24);
  const [thickness, setThickness] = useState<number>(12.7); // default 0.5 inch in mm

  const convertValue = (value: number, to: 'mm' | 'inches') => {
    return to === 'mm' ? value * 25.4 : value / 25.4;
  };

  const handleUnitChange = (newUnit: 'mm' | 'inches') => {
    if (newUnit !== unit) {
      setLength(prev => parseFloat(convertValue(prev, newUnit).toFixed(3)));
      setWidth(prev => parseFloat(convertValue(prev, newUnit).toFixed(3)));
      setThickness(prev => parseFloat(convertValue(prev, newUnit).toFixed(3)));
      setUnit(newUnit);
    }
  };

  return (
    <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        {/* Unit Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Unit</label>
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as 'mm' | 'inches')}
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
            onChange={(e) => setLength(Number(e.target.value))}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm">{unit}</span>
        </div>

        {/* Width */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Width:</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-28 border-0 focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm">{unit}</span>
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-blue-500 rounded">
            <Image
              src={"/images/workspace/cursor.svg"}
              alt="Cursor"
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          </button>
          <button className="p-1 hover:bg-blue-500 rounded">
            <Image
              src={"/images/workspace/hand.svg"}
              alt="Hand"
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          </button>
          <button className="p-1 hover:bg-blue-500 rounded">
            <Image
              src={"/images/workspace/box.svg"}
              alt="Box"
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
