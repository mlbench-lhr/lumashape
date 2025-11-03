import React, { useState, useCallback, useRef, useEffect } from 'react';

// RotationWheel component (function)
interface RotationWheelProps {
  toolId: string;
  currentRotation: number;
  onRotationChange: (toolId: string, rotation: number) => void;
  toolWidth: number;
  toolHeight: number;
  viewportZoom: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

// RotationWheel component
const RotationWheel: React.FC<RotationWheelProps> = ({
  toolId,
  currentRotation,
  onRotationChange,
  toolWidth,
  toolHeight,
  viewportZoom,
  flipHorizontal,
  flipVertical,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const SNAP_DEGREES = 15;
  const SNAP_THRESHOLD_DEGREES = 4; // snap when within 4° of a tick

  // Smaller wheel: scale to tool size with safe min/max
  const wheelRadius = Math.max(40, Math.min(56, Math.max(toolWidth, toolHeight) * 0.2));
  const wheelSize = wheelRadius * 2;
  const inverseScale = 1 / Math.max(viewportZoom, 0.1);

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

    // Proximity snap: only snap when close to a 15° tick
    const nearest = Math.round(angle / SNAP_DEGREES) * SNAP_DEGREES;
    const rawDiff = Math.abs(nearest - angle);
    const diff = Math.min(rawDiff, 360 - rawDiff);

    const next = diff <= SNAP_THRESHOLD_DEGREES ? nearest : angle;
    const normalized = ((next % 360) + 360) % 360;
    onRotationChange(toolId, normalized);
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

  // Calculate pin position based on current rotation.
  // Since the wheel container counter-rotates, doubling the angle keeps the pin aligned
  // with the tool's real rotation in screen space.
  const pinAngle = ((currentRotation) * Math.PI) / 180;
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
        zIndex: 9999,
        // Counter-rotate and de-flip to keep the wheel static
        transform: `scaleY(${flipVertical ? -1 : 1}) scaleX(${flipHorizontal ? -1 : 1}) rotate(${-currentRotation}deg) scale(${inverseScale})`,
        transformOrigin: 'center',
      }}
    >
      {/* SVG for the wheel with center line and ticks */}
      <svg
        width={wheelSize}
        height={wheelSize}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        {/* Transparent circle with black border */}
        <circle
          cx={wheelRadius}
          cy={wheelRadius}
          r={wheelRadius - 1}
          fill="transparent"
          stroke="black"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const isMainTick = i % 6 === 0; // 90°
          const tickLength = isMainTick ? 10 : 5;
          const tickWidth = isMainTick ? 1.5 : 1;

          const startRadius = wheelRadius - 12;
          const endRadius = wheelRadius - 12 + tickLength;

          const x1 = Math.cos(angle) * startRadius + wheelRadius;
          const y1 = Math.sin(angle) * startRadius + wheelRadius;
          const x2 = Math.cos(angle) * endRadius + wheelRadius;
          const y2 = Math.sin(angle) * endRadius + wheelRadius;

          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="black"
              strokeWidth={tickWidth}
            />
          );
        })}

        {/* Center dot */}
        <circle
          cx={wheelRadius}
          cy={wheelRadius}
          r={2}
          fill="black"
        />

        {/* Line from center to green dot */}
        <line
          x1={wheelRadius}
          y1={wheelRadius}
          x2={wheelRadius + pinX}
          y2={wheelRadius + pinY}
          stroke="black"
          strokeWidth="1.5"
          pointerEvents="none"
        />
      </svg>

      {/* Green rotation pin */}
      <div
        className="absolute w-3 h-3 bg-green-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto shadow-md border border-black/60"
        style={{
          left: `${wheelRadius + pinX - 6}px`,
          top: `${wheelRadius + pinY - 6}px`,
          transform: isDragging ? 'scale(1.15)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default RotationWheel;