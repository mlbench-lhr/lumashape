'use client';

import React, { useEffect, useState } from 'react';
import DesignLayout from '@/components/Workspace/DesignLayout/DesignLayout';
import { DroppedTool } from '@/components/Workspace/DesignLayout/types';

type Unit = 'mm' | 'inches';

interface CanvasInit {
  width: number;
  height: number;
  unit: Unit;
  thickness: number;
}

interface ShapeData {
  width_inches?: number;
  height_inches?: number;
  radius_inches?: number;
  points?: Array<{ x: number; y: number }>;
}

interface ToolMetadata {
  toolBrand?: string;
  length?: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface LayoutTool {
  id: string;
  name: string;
  image?: string;
  unit?: Unit;
  x?: number;
  y?: number;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  opacity?: number;
  smooth?: number;
  groupId?: string;
  isCustomShape?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'polygon';
  shapeData?: ShapeData;
  metadata?: ToolMetadata;
  realWidth?: number;
  realHeight?: number;
  width?: number;
  length?: number;
  thickness?: number;
}

interface LayoutData {
  _id: string;
  name: string;
  canvas: {
    width: number;
    height: number;
    unit: Unit;
    thickness: number;
  };
  tools: LayoutTool[];
}

const inchesToPx = (inches: number) => inches * 96;
const mmToPx = (mm: number) => (mm / 25.4) * 96;

const convertUnits = (value: number, from: Unit, to: Unit) => {
  if (from === to) return value;
  return from === 'mm' ? value / 25.4 : value * 25.4;
};

function getAuthToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  } catch {
    return null;
  }
}

export default function EditLayoutPage({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  const [initialTools, setInitialTools] = useState<DroppedTool[]>([]);
  const [initialCanvas, setInitialCanvas] = useState<CanvasInit | null>(null);
  const [ready, setReady] = useState(false);
  const { layoutId } = React.use(params);

  useEffect(() => {
    async function loadLayout() {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/layouts?id=${layoutId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error(json.error || 'Failed to fetch layout');
        return;
      }

      const layout: LayoutData = json.data;
      const canvasUnit = layout.canvas.unit;
      const canvasHeightPx =
        canvasUnit === 'inches'
          ? inchesToPx(layout.canvas.height)
          : mmToPx(layout.canvas.height);

      const mapped: DroppedTool[] = layout.tools.map((t) => {
        const toolUnit: Unit = t.unit || canvasUnit;

        // Convert DB positions (inches, bottom-left origin) to top-left pixels
        const xPx = toolUnit === 'inches' ? inchesToPx(t.x || 0) : mmToPx(t.x || 0);
        const yPxRaw = toolUnit === 'inches' ? inchesToPx(t.y || 0) : mmToPx(t.y || 0);
        const yPx = canvasHeightPx - yPxRaw;

        let widthCanvasUnits = 0;
        let lengthCanvasUnits = 0;
        let widthPxFallback = 0;
        let heightPxFallback = 0;

        let toolBrand: string = t.metadata?.toolBrand || '';

        // Handle shapes
        if (t.isCustomShape && t.shapeType && t.shapeData) {
          toolBrand = 'SHAPE';
          const sd = t.shapeData;

          if (
            t.shapeType === 'rectangle' &&
            typeof sd.width_inches === 'number' &&
            typeof sd.height_inches === 'number'
          ) {
            const wInches = sd.width_inches;
            const hInches = sd.height_inches;
            widthCanvasUnits = canvasUnit === 'mm' ? wInches * 25.4 : wInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? hInches * 25.4 : hInches;
          } else if (
            t.shapeType === 'circle' &&
            typeof sd.radius_inches === 'number'
          ) {
            const diameterInches = sd.radius_inches * 2;
            widthCanvasUnits = canvasUnit === 'mm' ? diameterInches * 25.4 : diameterInches;
            lengthCanvasUnits = widthCanvasUnits;
          } else if (Array.isArray(sd.points)) {
            const points = sd.points;
            const minX = Math.min(...points.map((p) => p.x));
            const maxX = Math.max(...points.map((p) => p.x));
            const minY = Math.min(...points.map((p) => p.y));
            const maxY = Math.max(...points.map((p) => p.y));
            const widthInches = maxX - minX;
            const heightInches = maxY - minY;
            widthCanvasUnits = canvasUnit === 'mm' ? widthInches * 25.4 : widthInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? heightInches * 25.4 : heightInches;
          }
        } else {
          // Non-shape tools
          if (t.metadata?.length) {
            const heightPx = inchesToPx(t.metadata.length);
            const aspect =
              t.metadata.naturalWidth && t.metadata.naturalHeight
                ? t.metadata.naturalWidth / t.metadata.naturalHeight
                : 1.6;
            heightPxFallback = heightPx;
            widthPxFallback = heightPx * aspect;
          } else {
            const rw = t.realWidth ?? t.width ?? 0;
            const rh = t.realHeight ?? t.length ?? 0;
            if (toolUnit === 'mm') {
              widthPxFallback = mmToPx(rw);
              heightPxFallback = mmToPx(rh);
            } else {
              widthPxFallback = inchesToPx(rw);
              heightPxFallback = inchesToPx(rh);
            }
          }
        }

        return {
          id: t.id,
          name: t.name,
          icon: t.image || (t.isCustomShape ? '⬜' : ''),
          image: t.image,
          metadata: t.metadata,
          x: xPx,
          y: yPx,
          rotation: t.rotation ?? 0,
          flipHorizontal: !!t.flipHorizontal,
          flipVertical: !!t.flipVertical,
          width: widthCanvasUnits || widthPxFallback || 50,
          length: lengthCanvasUnits || heightPxFallback || 50,
          thickness: convertUnits(t.thickness || 1, toolUnit, canvasUnit),
          unit: canvasUnit,
          opacity: t.opacity ?? 100,
          smooth: t.smooth ?? 0,
          groupId: t.groupId,
          isSelected: false,
          realWidth: t.realWidth,
          realHeight: t.realHeight,
          toolBrand,
        } as DroppedTool;
      });

      setInitialCanvas({
        width: layout.canvas.width,
        height: layout.canvas.height,
        unit: layout.canvas.unit,
        thickness: layout.canvas.thickness,
      });

      setInitialTools(mapped);

      sessionStorage.setItem(
        'layoutForm',
        JSON.stringify({
          layoutName: layout.name,
          canvasWidth: layout.canvas.width,
          canvasHeight: layout.canvas.height,
          units: layout.canvas.unit,
          thickness: layout.canvas.thickness,
        })
      );
      sessionStorage.setItem('editingLayoutId', layoutId);
      setReady(true);
    }

    loadLayout();
  }, [layoutId]);

  if (!ready || !initialCanvas) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-600">
        Loading layout...
      </div>
    );
  }

  return (
    <DesignLayout
      initialDroppedTools={initialTools}
      initialCanvas={initialCanvas}
      editingLayoutId={layoutId}
    />
  );
}
