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

export default function EditLayoutPage({ params }: { params: { layoutId: string } }) {
  const [initialTools, setInitialTools] = useState<DroppedTool[]>([]);
  const [initialCanvas, setInitialCanvas] = useState<CanvasInit | null>(null);
  const [ready, setReady] = useState(false);
  const layoutId = params.layoutId;

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

      const layout = json.data;
      const canvasUnit: Unit = layout.canvas.unit;
      const canvasWidth = layout.canvas.width as number;
      const canvasHeight = layout.canvas.height as number;
      const canvasHeightPx =
        canvasUnit === 'inches' ? inchesToPx(canvasHeight) : mmToPx(canvasHeight);

      const mapped: DroppedTool[] = (layout.tools || []).map((t: any) => {
        const toolUnit: Unit = t.unit || canvasUnit;

        // Convert DB positions (inches, bottom-left origin) to top-left pixels
        const xPx = toolUnit === 'inches' ? inchesToPx(t.x || 0) : mmToPx(t.x || 0);
        const yPxRaw = toolUnit === 'inches' ? inchesToPx(t.y || 0) : mmToPx(t.y || 0);
        const yPx = canvasHeightPx - yPxRaw;

        // Derive width/length from saved data
        let widthCanvasUnits = 0;
        let lengthCanvasUnits = 0;
        let widthPxFallback = 0;
        let heightPxFallback = 0;

        // Shapes: use shapeData width/height inches, convert to canvas unit, and mark as SHAPE
        let toolBrand: string = t.metadata?.toolBrand || '';
        if (t.isCustomShape && t.shapeType && t.shapeData) {
          toolBrand = 'SHAPE';

          if (t.shapeType === 'rectangle' &&
              typeof t.shapeData.width_inches === 'number' &&
              typeof t.shapeData.height_inches === 'number') {
            const wInches = t.shapeData.width_inches as number;
            const hInches = t.shapeData.height_inches as number;
            widthCanvasUnits = canvasUnit === 'mm' ? wInches * 25.4 : wInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? hInches * 25.4 : hInches;
          } else if (t.shapeType === 'circle' &&
                     typeof t.shapeData.radius_inches === 'number') {
            const diameterInches = (t.shapeData.radius_inches as number) * 2;
            widthCanvasUnits = canvasUnit === 'mm' ? diameterInches * 25.4 : diameterInches;
            lengthCanvasUnits = widthCanvasUnits;
          } else if (Array.isArray(t.shapeData.points)) {
            const points = t.shapeData.points as Array<{ x: number; y: number }>;
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
          // Image/non-shape tools:
          // Prefer metadata.length (height inches) + aspect ratio (naturalWidth/naturalHeight)
          if (t.metadata?.length) {
            const heightPx = inchesToPx(t.metadata.length as number);
            let aspect = 1.6;
            if (t.metadata?.naturalWidth > 0 && t.metadata?.naturalHeight > 0) {
              aspect = t.metadata.naturalWidth / t.metadata.naturalHeight;
            }
            heightPxFallback = heightPx;
            widthPxFallback = heightPx * aspect;
          } else {
            // Fallback: use realWidth/realHeight (saved at layout save) converted from unit to px
            const rw = typeof t.realWidth === 'number' ? t.realWidth : (t.width || 0);
            const rh = typeof t.realHeight === 'number' ? t.realHeight : (t.length || 0);
            if (toolUnit === 'mm') {
              widthPxFallback = mmToPx(rw || 0);
              heightPxFallback = mmToPx(rh || 0);
            } else {
              widthPxFallback = inchesToPx(rw || 0);
              heightPxFallback = inchesToPx(rh || 0);
            }
          }
        }

        return {
          id: t.id,
          name: t.name,
          // Shapes need an icon to render when no image
          icon: t.image || (t.isCustomShape ? '⬜' : ''),
          image: t.image,
          metadata: t.metadata || undefined,
          x: xPx,
          y: yPx,
          rotation: typeof t.rotation === 'number' ? t.rotation : 0,
          flipHorizontal: !!t.flipHorizontal,
          flipVertical: !!t.flipVertical,
          // Shapes: width/length are in canvas units so useCanvas can convert to px
          // Non-shapes: width/length fallback set in px for getToolDimensions fallback path
          width: widthCanvasUnits || widthPxFallback || 50,
          length: lengthCanvasUnits || heightPxFallback || 50,
          thickness: convertUnits(t.thickness || 1, toolUnit, canvasUnit),
          unit: canvasUnit,
          opacity: typeof t.opacity === 'number' ? t.opacity : 100,
          smooth: typeof t.smooth === 'number' ? t.smooth : 0,
          groupId: t.groupId,
          isSelected: false,
          realWidth: typeof t.realWidth === 'number' ? t.realWidth : undefined,
          realHeight: typeof t.realHeight === 'number' ? t.realHeight : undefined,
          toolBrand, // critical: marks shapes so sizes use canvas units
        } as DroppedTool;
      });

      setInitialCanvas({
        width: canvasWidth,
        height: canvasHeight,
        unit: canvasUnit,
        thickness: layout.canvas.thickness as number,
      });

      setInitialTools(mapped);
      try {
        sessionStorage.setItem('editingLayoutId', layoutId);
      } catch {}
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