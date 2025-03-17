import { useState, useEffect } from 'react';
import { Line } from '../types';

interface UseUndoRedoParams {
  lines: Line[];
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
}

export const useUndoRedo = ({ lines, setLines }: UseUndoRedoParams) => {
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlPressed = e.ctrlKey || e.metaKey;

      if (ctrlPressed && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((ctrlPressed && e.key === 'y') || (ctrlPressed && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    if (lastAction.type === 'line') {
      setRedoStack(prev => [...prev, { type: 'line', data: lines }]);
      setLines(lastAction.data);
    } else if (lastAction.type === 'clear') {
      setRedoStack(prev => [...prev, { type: 'clear', data: { lines } }]);
      setLines(lastAction.data.lines);
    } else if (lastAction.type === 'erase') {
      setRedoStack(prev => [...prev, { type: 'erase', data: lines }]);
      setLines(lastAction.data);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));

    if (nextAction.type === 'line') {
      setUndoStack(prev => [...prev, { type: 'line', data: lines }]);
      setLines(nextAction.data);
    } else if (nextAction.type === 'clear') {
      setUndoStack(prev => [...prev, { type: 'clear', data: { lines } }]);
      setLines(nextAction.data.lines);
    } else if (nextAction.type === 'erase') {
      setUndoStack(prev => [...prev, { type: 'erase', data: lines }]);
      setLines(nextAction.data);
    }
  };

  return {
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    handleUndo,
    handleRedo
  };
};