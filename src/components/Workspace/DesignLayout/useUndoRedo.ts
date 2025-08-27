// useUndoRedo.ts
import { useState, useCallback } from 'react';
import { DroppedTool } from './types';

interface UndoRedoState {
  history: DroppedTool[][];
  currentIndex: number;
}

export const useUndoRedo = (initialState: DroppedTool[] = []) => {
  const [state, setState] = useState<UndoRedoState>({
    history: [initialState],
    currentIndex: 0,
  });

  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.history.length - 1;

  const pushState = useCallback((newState: DroppedTool[]) => {
    setState(prevState => {
      // Don't add if it's the same as current state
      const currentState = prevState.history[prevState.currentIndex];
      if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        return prevState;
      }

      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1);
      newHistory.push([...newState]);
      
      const limitedHistory = newHistory.slice(-50);
      
      return {
        history: limitedHistory,
        currentIndex: limitedHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      setState(prevState => ({
        ...prevState,
        currentIndex: prevState.currentIndex - 1,
      }));
      return state.history[state.currentIndex - 1];
    }
    return null;
  }, [canUndo, state.history, state.currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setState(prevState => ({
        ...prevState,
        currentIndex: prevState.currentIndex + 1,
      }));
      return state.history[state.currentIndex + 1];
    }
    return null;
  }, [canRedo, state.history, state.currentIndex]);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};