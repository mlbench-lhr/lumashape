"use client";
import React, { useState, useCallback, useEffect } from "react";
import Header from "./Header";
import ControlBar from "./ControlBar";
import Canvas from "./Canvas";
import Sidebar from "./Sidebar";
import { DroppedTool, Tool } from "./types";
import { useUndoRedo } from './toolUtils';

function DesignLayout({
  initialDroppedTools,
  initialCanvas,
  editingLayoutId,
  readOnly,
}: {
  initialDroppedTools?: DroppedTool[];
  initialCanvas?: { width: number; height: number; unit: 'mm' | 'inches'; thickness: number; materialColor?: string };
  editingLayoutId?: string;
  readOnly?: boolean;
}) {
  // Seed with initial values if provided
  const [droppedTools, setDroppedTools] = useState<DroppedTool[]>(initialDroppedTools || []);
  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialDroppedTools || []);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Canvas dimensions (controlled by ControlBar)
  const [canvasWidth, setCanvasWidth] = useState<number>(initialCanvas?.width ?? 400);
  const [canvasHeight, setCanvasHeight] = useState<number>(initialCanvas?.height ?? 300);
  const [thickness, setThickness] = useState<number>(initialCanvas?.thickness ?? 12.7);
  const [unit, setUnit] = useState<'mm' | 'inches'>(initialCanvas?.unit ?? 'mm');
  const [materialColor, setMaterialColor] = useState<string>(initialCanvas?.materialColor ?? 'blue');

  useEffect(() => {
    if (editingLayoutId) {
      try { sessionStorage.setItem('editingLayoutId', editingLayoutId); } catch { }
    }
    if (initialDroppedTools && initialDroppedTools.length) {
      pushState(initialDroppedTools);
    }
  }, [editingLayoutId, initialDroppedTools, pushState]);

  // State for active tool (cursor, hand, box)
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'box' | 'fingercut'>('cursor');

  // State for overlap detection (passed from Canvas)
  const [hasOverlaps, setHasOverlaps] = useState<boolean>(false);

  // NEW: suppress selection UI when taking a snapshot
  const [suppressSelectionUI, setSuppressSelectionUI] = useState(false);

  // Unit conversion helper
  const convertValue = (
    value: number,
    from: 'mm' | 'inches',
    to: 'mm' | 'inches'
  ): number => {
    if (from === to) return value;
    return from === 'mm' && to === 'inches'
      ? value / 25.4
      : value * 25.4;
  };



  // Batch history while an interaction is in progress
  const [isHistoryBatching, setIsHistoryBatching] = useState(false);

  // Update dropped tools with history tracking (skip pushes while batching)
  const updateDroppedTools = useCallback((updater: React.SetStateAction<DroppedTool[]>) => {
    setDroppedTools(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      if (!isHistoryBatching) {
        pushState(newState);
      }
      return newState;
    });
  }, [pushState, isHistoryBatching]);

  // Begin/end gesture batching
  const beginHistoryBatch = useCallback(() => {
    setIsHistoryBatching(true);
  }, []);


  // Handle unit change - convert canvas and normalize tool units for shapes/finger cuts/text
  const handleUnitChange = useCallback((newUnit: 'mm' | 'inches') => {
    if (newUnit === unit) return;

    const convertedCanvasWidth = parseFloat(convertValue(canvasWidth, unit, newUnit).toFixed(3));
    const convertedCanvasHeight = parseFloat(convertValue(canvasHeight, unit, newUnit).toFixed(3));
    const convertedThickness = parseFloat(convertValue(thickness, unit, newUnit).toFixed(3));

    setCanvasWidth(convertedCanvasWidth);
    setCanvasHeight(convertedCanvasHeight);
    setThickness(convertedThickness);
    setUnit(newUnit);

    updateDroppedTools(prev =>
      prev.map(tool => {
        const isShape = tool.toolBrand === 'SHAPE';
        const isFinger = tool.metadata?.isFingerCut || tool.toolBrand === 'FINGERCUT';
        const isText = tool.toolBrand === 'TEXT' || tool.toolType === 'text';
        if (!isShape && !isFinger && !isText) return tool;

        const width = parseFloat(convertValue(tool.width, tool.unit, newUnit).toFixed(2));
        const length = parseFloat(convertValue(tool.length, tool.unit, newUnit).toFixed(2));
        const depth = parseFloat(convertValue(tool.depth, tool.unit, newUnit).toFixed(2));

        return { ...tool, width, length, depth, unit: newUnit };
      })
    );
  }, [unit, canvasWidth, canvasHeight, thickness, updateDroppedTools]);

  const endHistoryBatch = useCallback(() => {
    setIsHistoryBatching(false);
    // Commit final state at gesture end
    pushState(droppedTools);
  }, [pushState, droppedTools]);

  // Clear selection when selectedTool is cleared
  useEffect(() => {
    const firstSelected = selectedTools[0] || null;
    if (selectedTool !== firstSelected) {
      setSelectedTool(firstSelected);
    }
  }, [selectedTools]);


  // Keep selectedTool in sync with selectedTools
  useEffect(() => {
    if (selectedTool && !selectedTools.includes(selectedTool)) {
      setSelectedTool(selectedTools[0] || null);
    }
  }, [selectedTool, selectedTools]);

  const handleUndo = useCallback(() => {
    const undoneState = undo();
    if (undoneState) {
      setDroppedTools(undoneState);
      // Clear selections since the state has changed
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const redoneState = redo();
    if (redoneState) {
      setDroppedTools(redoneState);
      // Clear selections since the state has changed
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [redo]);

  // Handle successful save
  const handleSaveLayout = useCallback(() => {
    // Clear the layout state after successful save
    setDroppedTools([]);
    setSelectedTool(null);
    setSelectedTools([]);

    // Optionally show success message or redirect
    console.log('Layout saved successfully!');
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh)]">
      <Header
        droppedTools={droppedTools}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        thickness={thickness}
        unit={unit}
        hasOverlaps={hasOverlaps}
        onSaveLayout={handleSaveLayout}
        readOnly={readOnly}
        materialColor={materialColor}
        // NEW: allow header to toggle selection UI suppression
        setSuppressSelectionUI={setSuppressSelectionUI}
      />
      <ControlBar
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasHeight={canvasHeight}
        setCanvasHeight={setCanvasHeight}
        thickness={thickness}
        setThickness={setThickness}
        unit={unit}
        setUnit={handleUnitChange}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedToolId={selectedTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        readOnly={readOnly}
        materialColor={materialColor}
        setMaterialColor={setMaterialColor}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={updateDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          selectedTools={selectedTools}
          setSelectedTools={setSelectedTools}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          unit={unit}
          thickness={thickness}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onOverlapChange={setHasOverlaps}
          readOnly={readOnly}
          // NEW: pass suppression flag to Canvas
          suppressSelectionUI={suppressSelectionUI}
          beginInteraction={beginHistoryBatch}
          endInteraction={endHistoryBatch}
        />
        <div className="w-80 flex-shrink-0 min-h-0">
          <Sidebar
            droppedTools={droppedTools}
            selectedTool={selectedTool}
            selectedTools={selectedTools}
            activeTool={activeTool}
            setDroppedTools={updateDroppedTools}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            unit={unit}
            setActiveTool={setActiveTool}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

export default DesignLayout;