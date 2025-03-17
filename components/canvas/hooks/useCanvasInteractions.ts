import { useState, useRef, MouseEvent, WheelEvent, useEffect } from 'react';
import { Line, Point, DrawingTool, PanOffset } from '../types';


interface UseCanvasInteractionsParams {
  socketRef: React.MutableRefObject<any>;
  roomId: string;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<any[]>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  canvasSize: { width: number; height: number };
  historyLoaded: boolean;
  lines?: Line[]; // Optional lines to use instead of internal state
  setLines?: React.Dispatch<React.SetStateAction<Line[]>>; // Optional setLines to use instead of internal state
}
export const useCanvasInteractions = ({
  socketRef,
  roomId,
  setUndoStack,
  setRedoStack,
  canvasRef,
  canvasWrapperRef,
  canvasSize,
  historyLoaded,
  lines: externalLines,
  setLines: externalSetLines,
}: UseCanvasInteractionsParams) => {
  // Drawing state - either use provided external state or internal state
  const [internalLines, internalSetLines] = useState<Line[]>([]);

  // Use external lines and setLines if provided, otherwise use internal state
  const lines = externalLines !== undefined ? externalLines : internalLines;
  const setLines = externalSetLines || internalSetLines;

  // Debug the lines state when it changes
  useEffect(() => {
    console.log(`[Canvas] Lines state updated, now has ${lines.length} lines`);
    if (lines.length > 0) {
      console.log(
        `[Canvas] First line has ${lines[0].length} points with first point:`,
        JSON.stringify(lines[0][0])
      );
    }
  }, [lines]);
  const [currentLine, setCurrentLine] = useState<Line>([]);
  const [eraserPath, setEraserPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentWidth, setCurrentWidth] = useState(3);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [eraserRadius, setEraserRadius] = useState(50); // Default radius in pixels

  // UI state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isSpacePanningEnabled, setIsSpacePanningEnabled] = useState(false); // Track space key for panning

  // Initialize canvas size - only center on first load, not when zoom changes
  useEffect(() => {
    const centerCanvas = () => {
      if (canvasWrapperRef.current && !historyLoaded) {
        setPanOffset({
          x: (canvasWrapperRef.current.clientWidth - canvasSize.width) / 2,
          y: (canvasWrapperRef.current.clientHeight - canvasSize.height) / 2,
        });
      }
    };

    centerCanvas();

    const handleResize = () => {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePanningEnabled(true);
        e.preventDefault(); // Prevent default spacebar action (like scrolling)
        canvasWrapperRef.current?.classList.add('space-panning'); // Add class to change cursor
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePanningEnabled(false);
        setIsPanning(false); // Stop panning when space is released
        canvasWrapperRef.current?.classList.remove('space-panning'); // Remove class to reset cursor
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasSize, historyLoaded, canvasWrapperRef]);

  // Handle eraser action
  const handleEraserAction = (
    pos: { x: number; y: number },
    isStart: boolean = false
  ) => {
    // Add position to eraser path
    if (isStart) {
      setEraserPath([pos]);
    } else {
      setEraserPath(prev => [...prev, pos]);
    }

    const threshold = eraserRadius / zoomLevel; // Scale threshold by zoom level
    let hasChanges = false;
    let newLines: Line[] = [];

    // Process each line
    lines.forEach(line => {
      if (line.length < 2) {
        newLines.push(line);
        return;
      }

      const segmentsToKeep: Line[] = [];
      let currentSegment: Point[] = [];
      let lastPointWasErased = false;

      for (let i = 0; i < line.length; i++) {
        const point = line[i];
        let isPointErased = false;

        // Check against all eraser points within the current threshold
        for (const eraserPoint of eraserPath) {
          // Calculate distance from point to eraserPoint
          const dx = point.x - eraserPoint.x;
          const dy = point.y - eraserPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= threshold) {
            isPointErased = true;
            hasChanges = true;
            break;
          }
        }

        if (!isPointErased) {
          currentSegment.push(point);
          lastPointWasErased = false;
        } else {
          if (!lastPointWasErased && currentSegment.length > 0) {
            segmentsToKeep.push(currentSegment);
            currentSegment = [];
          }
          lastPointWasErased = true;
        }
      }

      if (currentSegment.length > 0) {
        segmentsToKeep.push(currentSegment);
      }
      newLines.push(...segmentsToKeep);
    });

    if (hasChanges) {
      // Save state for undo
      setUndoStack(prev => [...prev, { type: 'erase', data: lines }]);
      setRedoStack([]);

      // Update lines
      setLines(newLines);

      if (socketRef.current?.connected) {
        console.log("[Canvas] handleEraserAction: Emitting 'eraseDrawing' event to server");
        console.log("[Canvas] handleEraserAction: Lines data being sent:", JSON.stringify(newLines));
        socketRef.current.emit('eraseDrawing', { roomId, lines: newLines });
      }
    }
  };

  // Canvas interaction handlers
  const getRelativePos = (e: MouseEvent<HTMLCanvasElement>): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Calculate position considering zoom level
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel
    };
  };

  const handleMouseDownCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    // Store the current mouse position for potential zoom operations
    setLastMousePos({ x: e.clientX, y: e.clientY });

    // Spacebar + left mouse button for panning
    if (isSpacePanningEnabled && e.button === 0) {
      setIsPanning(true);
      setStartPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    // Disable middle mouse button panning
    if (e.button === 1) {
      return;
    }

    // Left mouse button for drawing or erasing
    if (e.button === 0) {
      const pos = getRelativePos(e);

      if (currentTool === 'pen') {
        setCurrentLine([{ x: pos.x, y: pos.y, color: currentColor, width: currentWidth }]);
        setIsDrawing(true);
      } else if (currentTool === 'delete') {
        // Start eraser action
        handleEraserAction(pos, true);
      }
    }
  };

  const handleMouseMoveCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    // Update the last mouse position
    setLastMousePos(prev => ({ x: e.clientX, y: e.clientY }));

    if (isPanning) {
      const dx = e.clientX - startPanPoint.x;
      const dy = e.clientY - startPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawing && currentTool === 'pen') {
      const pos = getRelativePos(e);
      setCurrentLine(prev => [...prev, {
        x: pos.x, y: pos.y, color: currentColor, width: currentWidth
      }]);
    } else if (currentTool === 'delete') {
      // Continue eraser action when moving with button pressed
      if (e.buttons === 1) { // Primary button is pressed
        const pos = getRelativePos(e);
        handleEraserAction(pos);
      }
    }
  };

  const handleMouseUpCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentTool === 'pen' && currentLine.length > 0) {
      // Save line and send to server
      setLines(prev => [...prev, currentLine]);
      setUndoStack(prev => [...prev, { type: 'line', data: lines }]);
      setRedoStack([]);

      if (socketRef.current?.connected) {
        socketRef.current.emit('drawing', { roomId, line: currentLine });
      }

      setCurrentLine([]);
    } else if (currentTool === 'delete') {
      // Clear eraser path
      setEraserPath([]);
    }

    setIsDrawing(false);
  };

  // Handle mouse wheel for zooming
  const handleMouseWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Calculate zoom change based on wheel delta
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + zoomDelta));

    if (newZoom !== zoomLevel) {
      // Calculate mouse position relative to canvas
      const canvasWrapper = canvasWrapperRef.current;
      if (!canvasWrapper) return;

      const rect = canvasWrapper.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the point on the canvas that is under the mouse
      const canvasPointX = (mouseX - panOffset.x) / zoomLevel;
      const canvasPointY = (mouseY - panOffset.y) / zoomLevel;

      // Calculate new panOffset to keep the point under the mouse
      const newPanOffsetX = mouseX - canvasPointX * newZoom;
      const newPanOffsetY = mouseY - canvasPointY * newZoom;

      // Update state
      setZoomLevel(newZoom);
      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    }
  };

  // Canvas action handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevel + 0.2);

    if (newZoom !== zoomLevel) {
      // Calculate the center of the visible canvas
      const canvasWrapper = canvasWrapperRef.current;
      if (!canvasWrapper) return;

      const rect = canvasWrapper.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate the point on the canvas that is at the center
      const canvasPointX = (centerX - panOffset.x) / zoomLevel;
      const canvasPointY = (centerY - panOffset.y) / zoomLevel;

      // Calculate new panOffset to keep the point at the center
      const newPanOffsetX = centerX - canvasPointX * newZoom;
      const newPanOffsetY = centerY - canvasPointY * newZoom;

      // Update state
      setZoomLevel(newZoom);
      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.2);

    if (newZoom !== zoomLevel) {
      // Calculate the center of the visible canvas
      const canvasWrapper = canvasWrapperRef.current;
      if (!canvasWrapper) return;

      const rect = canvasWrapper.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate the point on the canvas that is at the center
      const canvasPointX = (centerX - panOffset.x) / zoomLevel;
      const canvasPointY = (centerY - panOffset.y) / zoomLevel;

      // Calculate new panOffset to keep the point at the center
      const newPanOffsetX = centerX - canvasPointX * newZoom;
      const newPanOffsetY = centerY - canvasPointY * newZoom;

      // Update state
      setZoomLevel(newZoom);
      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    }
  };

  const handleClearCanvas = () => {
    setUndoStack(prev => [...prev, { type: 'clear', data: { lines } }]);
    setRedoStack([]);
    setLines([]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('clearCanvas', { roomId });
    }
  };

  const handleResetView = () => {
    if (canvasWrapperRef.current) {
      // Only reset when explicitly called, not during normal zoom operations
      setZoomLevel(1);
      setPanOffset({
        x: (canvasWrapperRef.current.clientWidth - canvasSize.width) / 2,
        y: (canvasWrapperRef.current.clientHeight - canvasSize.height) / 2
      });
    }
  };

  const handleToolSelect = (tool: DrawingTool) => {
    setCurrentTool(tool);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `mirror-${roomId}-${new Date().toISOString()}.png`;
    link.href = url;
    link.click();
  };

  // Add lastMousePos to the returned props
  return {
    lines,
    setLines,
    currentLine,
    setCurrentLine,
    isDrawing,
    currentTool,
    currentWidth,
    setCurrentWidth,
    currentColor,
    setCurrentColor,
    isPanning,
    panOffset,
    zoomLevel,
    eraserRadius,
    setEraserRadius,
    lastMousePos, // Ensure this is included
    handleMouseDownCanvas,
    handleMouseMoveCanvas,
    handleMouseUpCanvas,
    handleMouseWheel,
    handleZoomIn,
    handleZoomOut,
    handleClearCanvas,
    handleResetView,
    handleToolSelect,
    handleExport,
  };
};
