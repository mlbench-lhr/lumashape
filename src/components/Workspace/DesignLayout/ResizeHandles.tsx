import React, { useState, useCallback } from 'react';
import { DroppedTool } from './types';

interface ResizeHandlesProps {
  tool: DroppedTool;
  toolWidth: number;
  toolHeight: number;
  onResize: (toolId: string, newWidth: number, newHeight: number) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ tool, toolWidth, toolHeight, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: toolWidth,
      height: toolHeight
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = moveEvent.clientX - resizeStart.x;
      const deltaY = moveEvent.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Calculate new dimensions based on corner being dragged
      switch (corner) {
        case 'bottom-right':
          newWidth = Math.max(20, resizeStart.width + deltaX);
          newHeight = Math.max(20, resizeStart.height + deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newHeight = Math.max(20, resizeStart.height + deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(20, resizeStart.width + deltaX);
          newHeight = Math.max(20, resizeStart.height - deltaY);
          break;
        case 'top-left':
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newHeight = Math.max(20, resizeStart.height - deltaY);
          break;
      }

      // Convert pixel dimensions back to the tool's unit
      const pixelsPerInch = 96; // Standard DPI
      const pixelsPerMm = pixelsPerInch / 25.4;
      
      const pixelsPerUnit = tool.unit === 'inches' ? pixelsPerInch : pixelsPerMm;
      
      const newWidthInUnits = newWidth / pixelsPerUnit;
      const newHeightInUnits = newHeight / pixelsPerUnit;

      onResize(tool.id, newWidthInUnits, newHeightInUnits);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [tool.id, tool.unit, toolWidth, toolHeight, onResize, isResizing, resizeStart]);

  const handleStyle = {
    position: 'absolute' as const,
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    borderRadius: '2px',
    cursor: 'nw-resize',
    zIndex: 40,
  };

  return (
    <>
      {/* Top-left handle */}
      <div
        style={{
          ...handleStyle,
          top: '-4px',
          left: '-4px',
          cursor: 'nw-resize',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'top-left')}
      />
      
      {/* Top-right handle */}
      <div
        style={{
          ...handleStyle,
          top: '-4px',
          right: '-4px',
          cursor: 'ne-resize',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'top-right')}
      />
      
      {/* Bottom-left handle */}
      <div
        style={{
          ...handleStyle,
          bottom: '-4px',
          left: '-4px',
          cursor: 'sw-resize',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
      />
      
      {/* Bottom-right handle */}
      <div
        style={{
          ...handleStyle,
          bottom: '-4px',
          right: '-4px',
          cursor: 'se-resize',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
      />
    </>
  );
};

export default ResizeHandles;