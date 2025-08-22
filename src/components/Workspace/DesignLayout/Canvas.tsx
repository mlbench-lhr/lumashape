import React, { useRef, useState } from 'react';
import { DroppedTool, Tool } from './types';
import { RefreshCw } from 'lucide-react';

interface CanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
}

const Canvas: React.FC<CanvasProps> = ({ droppedTools, setDroppedTools, selectedTool, setSelectedTool }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const toolData = e.dataTransfer.getData('application/json');
    if (toolData && canvasRef.current) {
      const tool: Tool = JSON.parse(toolData);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 40; // Center the tool (assuming 80px width)
      const y = e.clientY - rect.top - 40;

      const newTool: DroppedTool = {
        ...tool,
        id: `${tool.id}-${Date.now()}`, // Unique ID for each instance
        x,
        y,
        rotation: 0,
      };

      setDroppedTools(prev => [...prev, newTool]);
    }
  };

  const handleToolMouseDown = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    const tool = droppedTools.find(t => t.id === toolId);
    if (tool && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - tool.x;
      const offsetY = e.clientY - rect.top - tool.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setSelectedTool(toolId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragOffset && selectedTool && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      setDroppedTools(prev => 
        prev.map(tool => 
          tool.id === selectedTool 
            ? { ...tool, x: Math.max(0, Math.min(newX, rect.width - 80)), y: Math.max(0, Math.min(newY, rect.height - 80)) }
            : tool
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDragOffset(null);
    setSelectedTool(null);
  };

  const handleToolDoubleClick = (toolId: string) => {
    setDroppedTools(prev => 
      prev.map(tool => 
        tool.id === toolId 
          ? { ...tool, rotation: (tool.rotation + 90) % 360 }
          : tool
      )
    );
  };

  const handleDeleteTool = (toolId: string) => {
    setDroppedTools(prev => prev.filter(tool => tool.id !== toolId));
  };

  return (
    <div className="flex-1 p-6">
      <div 
        ref={canvasRef}
        className="border-2 border-dashed border-gray-300 h-full relative bg-gray-50 rounded-lg"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dropped Tools */}
        {droppedTools.map(tool => (
          <div
            key={tool.id}
            className={`absolute cursor-move select-none group ${
              selectedTool === tool.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: tool.x,
              top: tool.y,
              transform: `rotate(${tool.rotation}deg)`,
            }}
            onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
            onDoubleClick={() => handleToolDoubleClick(tool.id)}
          >
            <div className="relative">
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full h-20 object-contain bg-white rounded-lg shadow-sm border border-gray-200"
                draggable={false}
              />
              {/* Delete button (shows on hover) */}
              <button
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTool(tool.id);
                }}
              >
                ×
              </button>
              {/* Tool info */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {tool.name}
              </div>
            </div>
          </div>
        ))}

        {/* Center refresh icon (when no tools) */}
        {droppedTools.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Drag tools from the sidebar to start designing</p>
          </div>
        )}

        {/* Drop zone indicator */}
        <div className="absolute inset-4 border-2 border-transparent rounded-lg transition-colors duration-200 pointer-events-none" />
      </div>
    </div>
  );
};
export default Canvas;