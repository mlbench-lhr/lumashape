import React, { useState, useCallback, useRef, useEffect } from 'react';

interface RotationWheelProps {
  toolId: string;
  currentRotation: number;
  onRotationChange: (toolId: string, rotation: number) => void;
  toolWidth: number;
  toolHeight: number;
}

// RotationWheel component
const RotationWheel: React.FC<RotationWheelProps> = ({
  toolId,
  currentRotation,
  onRotationChange,
  toolWidth,
  toolHeight,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  // Smaller wheel: scale to tool size with safe min/max
  const wheelRadius = Math.max(40, Math.min(56, Math.max(toolWidth, toolHeight) * 0.2));
  const wheelSize = wheelRadius * 2;

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Calculate angle in degrees (0° is right, increases clockwise)
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Normalize to 0-360 range
    if (angle < 0) angle += 360;
    
    return angle;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    // Keep rotation active outside canvas and show proper cursor
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const angle = calculateAngle(e.clientX, e.clientY);
    onRotationChange(toolId, angle);
  }, [isDragging, calculateAngle, onRotationChange, toolId]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate pin position based on current rotation
  const pinAngle = (currentRotation * Math.PI) / 180;
  const pinX = Math.cos(pinAngle) * (wheelRadius - 10);
  const pinY = Math.sin(pinAngle) * (wheelRadius - 10);

  return (
    <div
      ref={wheelRef}
      className="absolute pointer-events-none"
      style={{
        width: `${wheelSize}px`,
        height: `${wheelSize}px`,
        left: `${-wheelRadius + toolWidth / 2}px`,
        top: `${-wheelRadius + toolHeight / 2}px`,
        zIndex: 30,
      }}
    >
      {/* Transparent, subtle ring */}
      <div
        className="absolute inset-0 rounded-full border border-black/50 bg-transparent"
        style={{ boxShadow: 'none' }}
      >
        {/* Subtle tick marks */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const isMainTick = i % 6 === 0; // 90°
          const tickLength = isMainTick ? 10 : 5;
          const tickWidth = isMainTick ? 2 : 1;

          const startRadius = wheelRadius - 12;
          const endRadius = wheelRadius - 12 + tickLength;

          const x1 = Math.cos(angle) * startRadius + wheelRadius;
          const y1 = Math.sin(angle) * startRadius + wheelRadius;
          const x2 = Math.cos(angle) * endRadius + wheelRadius;
          const y2 = Math.sin(angle) * endRadius + wheelRadius;

          return (
            <div
              key={i}
              className="absolute bg-black/60"
              style={{
                left: `${Math.min(x1, x2)}px`,
                top: `${Math.min(y1, y2)}px`,
                width: `${Math.abs(x2 - x1) || tickWidth}px`,
                height: `${Math.abs(y2 - y1) || tickWidth}px`,
                transformOrigin: '0 0',
                transform: `rotate(${angle}rad)`,
              }}
            />
          );
        })}

        {/* Center dot (subtle) */}
        <div
          className="absolute w-1.5 h-1.5 bg-black/60 rounded-full"
          style={{
            left: `${wheelRadius - 3}px`,
            top: `${wheelRadius - 3}px`,
          }}
        />
      </div>

      {/* Smaller green rotation pin */}
      <div
        className="absolute w-3 h-3 bg-green-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto shadow-md border border-black/60"
        style={{
          left: `${wheelRadius + (Math.cos((currentRotation * Math.PI) / 180) * (wheelRadius - 10)) - 6}px`,
          top: `${wheelRadius + (Math.sin((currentRotation * Math.PI) / 180) * (wheelRadius - 10)) - 6}px`,
          transform: isDragging ? 'scale(1.15)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Angle indicator (optional, subtle) */}
      <div
        className="absolute text-[40px] font-medium text-black/80 bg-primary/40 px-1.5 py-0.5 rounded pointer-events-none"
        style={{
          left: '50%',
          top: `${wheelSize + 6}px`,
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {Math.round(currentRotation)}°
      </div>
    </div>
  );
};

export default RotationWheel;