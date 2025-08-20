import React from 'react';
import { RefreshCw } from 'lucide-react';

const Canvas: React.FC = () => {
  return (
    <div className="flex-1 p-6">
      <div className="border-2 border-dashed border-gray-300 h-full relative bg-gray-50 rounded-lg">
        {/* Tools in canvas */}
        <div className="absolute top-20 left-1/4 flex flex-col items-center">
          <div className="w-24 h-32 bg-gray-700 rounded-lg mb-2 relative">
            {/* Pliers shape */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full"></div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full"></div>
          </div>
          <span className="text-xs text-gray-500">Cut Depth: 1.00in</span>
        </div>
        
        <div className="absolute top-20 right-1/4 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-600 rounded-full relative">
            {/* Scissors shape */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
        
        {/* Center refresh icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <RefreshCw className="w-6 h-6 text-gray-400" />
        </div>
        
        {/* Error message */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 rounded-lg px-4 py-2">
          <span className="text-red-700 text-sm">
            <strong>Note:</strong> The layout that you have selected is invalid
          </span>
        </div>
      </div>
    </div>
  );
};

export default Canvas;