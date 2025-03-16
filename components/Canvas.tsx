// Canvas.tsx
import React, { useRef, useState, useEffect, MouseEvent, useCallback, WheelEvent } from 'react';
import { Socket } from 'socket.io-client';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import for React-Quill
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Types
export interface CanvasProps {
  roomId: string;
  socket: Socket;
}

interface Point { x: number; y: number; color: string; width: number; }
type Line = Point[];
type DrawingTool = 'pen' | 'delete';

const Canvas: React.FC<CanvasProps> = ({ roomId, socket }) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Drawing state
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line>([]);
  const [eraserPath, setEraserPath] = useState<{x: number, y: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentWidth, setCurrentWidth] = useState(3);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [editorContent, setEditorContent] = useState('');

  // UI state
  const [dividerPos, setDividerPos] = useState<number>(70);
  const [dragging, setDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [canvasSize] = useState({ width: 2000, height: 1500 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const [showTipModal, setShowTipModal] = useState(true);
  const [isSocketUpdate, setIsSocketUpdate] = useState(false); // Flag to track socket updates

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Premium color palette
  const colors = [
    '#f8f9fa', // White
    '#dee2e6', // Light Gray
    '#6c757d', // Mid Gray
    '#343a40', // Dark Gray
    '#7209b7', // Royal Purple
    '#4361ee', // Royal Blue
    '#4cc9f0', // Cyan
    '#06d6a0', // Emerald
    '#ffd166', // Gold
    '#ef476f'  // Coral
  ];

  // Store socket reference
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Function to check if a point is on a line
  const isPointNearLine = (point: {x: number, y: number}, line: Line, threshold: number): boolean => {
    for (let i = 1; i < line.length; i++) {
      const p1 = line[i-1];
      const p2 = line[i];

      // Calculate distance from point to line segment
      const A = point.x - p1.x;
      const B = point.y - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;

      // Closest point parameter
      let param = -1;
      if (len_sq !== 0) {
        param = dot / len_sq;
      }

      let xx, yy;

      // Find the closest point on the line segment
      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      // Calculate distance from point to closest point on line segment
      const dx = point.x - xx;
      const dy = point.y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= threshold) {
        return true;
      }
    }

    return false;
  };
  const handleEraserAction = (pos: {x: number, y: number}, isStart: boolean = false) => {
    // Add position to eraser path
    if (isStart) {
      setEraserPath([pos]);
    } else {
      setEraserPath(prev => [...prev, pos]);
    }

    const threshold = 12 / zoomLevel; // Adjust based on zoom level and desired eraser size
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

        for (const eraserPoint of eraserPath) {
          if (isPointNearLine(eraserPoint, [i > 0 ? line[i-1] : point, point], threshold)) { // Check segment before and current point
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
        console.log("[Canvas] handleEraserAction: Emitting 'eraseDrawing' event to server"); // ADD THIS LOG
        console.log("[Canvas] handleEraserAction: Lines data being sent:", JSON.stringify(newLines)); // Log data being sent
        socketRef.current.emit('eraseDrawing', { roomId, lines: newLines });
      }
    }
  };
  // Function to smooth lines using the Catmull-Rom spline algorithm
  const smoothLine = (points: Point[]): Point[] => {
    if (points.length < 3) return points;

    const smoothed: Point[] = [];

    // Add the first point
    smoothed.push(points[0]);

    // Generate smooth points between each pair of original points
    for (let i = 0; i < points.length - 2; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : points[i + 1];

      // Add extra points between p1 and p2 using Catmull-Rom
      for (let t = 0; t <= 1; t += 0.1) {
        const t2 = t * t;
        const t3 = t2 * t; // Corrected line: t3 = t2 * t

        // Catmull-Rom spline formula
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        smoothed.push({
          x,
          y,
          color: p1.color,
          width: p1.width
        });
      }
    }

    // Add the last point
    smoothed.push(points[points.length - 1]);

    return smoothed;
  };

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'clean'],
      ['code-block']
    ]
  };

  // Socket connection and room joining
  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      socket.emit('joinRoom', roomId);
      socket.emit('requestHistory', { roomId });
    };

    socket.on('connect', handleConnect);
    return () => { socket.off('connect', handleConnect); };
  }, [socket, roomId]);

  // Handle incoming history data
  useEffect(() => {
    if (!socket) return;

    const handleHistory = (data: any) => {
      if (data && typeof data === 'object') {
        if (!data.roomId || data.roomId === roomId) {
          // Process lines
          if (data.lines && Array.isArray(data.lines)) {
            console.log("[Canvas] handleHistory: Received 'history' event from server");
            console.log("[Canvas] handleHistory: Lines data received:", JSON.stringify(data.lines)); // Log data received
            setLines(data.lines.filter((line: any) => Array.isArray(line) && line.length > 0));
            console.log("[Canvas] handleHistory: Lines state updated.");
          } else if (Array.isArray(data)) {
            console.log("[Canvas] handleHistory: Received 'history' event from server (array format)");
            console.log("[Canvas] handleHistory: Lines data received:", JSON.stringify(data)); // Log data received
            setLines(data.filter((line: any) => Array.isArray(line) && line.length > 0));
            console.log("[Canvas] handleHistory: Lines state updated from array format.");
          } else {
            setLines([]);
            console.log("[Canvas] handleHistory: Received 'history' event from server, but no valid lines data. Clearing lines."); // **LOGGING**
          }

          // Process content
          if (data.text !== undefined) {
            setEditorContent(data.text);
          }

          setHistoryLoaded(true);
        }
      }
    };

    socket.on('history', handleHistory);

    // Request history until received
    const requestInterval = setInterval(() => {
      if (!historyLoaded && socket.connected) {
        socket.emit('requestHistory', { roomId });
        socket.emit('joinRoom', roomId);
      } else if (historyLoaded) {
        clearInterval(requestInterval);
      }
    }, 2000);

    return () => {
      clearInterval(requestInterval);
      socket.off('history', handleHistory);
    };
  }, [socket, roomId, historyLoaded]);

  // Socket event listeners for collaborative features
  useEffect(() => {
    if (!socket) return;

    const handleDrawing = (data: { line: Line; roomId: string }) => {
      if (data.roomId === roomId && data.line && Array.isArray(data.line)) {
        setLines(prev => [...prev, data.line]);
      }
    };

    const handleClearCanvas = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setLines([]);
        setUndoStack([]);
        setRedoStack([]);
      }
    };

    const handleTextUpdate = (data: { text: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setEditorContent(data.text);
      }
    };

    // **Removed: handleEraseDrawing - we will use handleHistory for updates after erase**

    // Register event handlers
    const events = {
      'drawing': handleDrawing,
      'clearCanvas': handleClearCanvas,
      'textUpdate': handleTextUpdate,
      // **Removed: 'eraseDrawing': handleEraseDrawing**
    };

    // Add listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.off(event);
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, roomId]);

  // Initialize canvas size - only center on first load, not when zoom changes
  useEffect(() => {
    const centerCanvas = () => {
      if (canvasWrapperRef.current && !historyLoaded) {
        setPanOffset({
          x: (canvasWrapperRef.current.clientWidth - canvasSize.width) / 2,
          y: (canvasWrapperRef.current.clientHeight - canvasSize.height) / 2
        });
      }
    };

    centerCanvas();

    const handleResize = () => {
      // On resize, maintain relative position rather than re-centering
      if (canvasWrapperRef.current) {
        const rect = canvasWrapperRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;


      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasSize, historyLoaded]);

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw premium background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#111122');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grid pattern
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw all elements
    drawLines(ctx, lines);

    // Draw current line if drawing
    if (currentLine.length > 0) {
      ctx.beginPath();
      currentLine.forEach((point, index) => {
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  }, [lines, currentLine, canvasSize]);

  // Helper function to draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;

    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Helper function to draw lines
  const drawLines = (ctx: CanvasRenderingContext2D, lines: Line[]) => {
    lines.forEach(line => {
      if (line.length > 0) {
        try {
          // Apply line smoothing if there are enough points
          const pointsToDraw = line.length >= 3 ? smoothLine(line) : line;

          ctx.beginPath();
          pointsToDraw.forEach((point, index) => {
            ctx.strokeStyle = point.color || '#ffffff';
            ctx.lineWidth = point.width || 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        } catch (err) {
          console.error("[Canvas] Error drawing line:", err);
        }
      }
    });
  };

  // Handle divider dragging
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (dragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newPos = ((e.clientX - rect.left) / rect.width) * 100;
        setDividerPos(Math.max(30, Math.min(90, newPos)));
      }
    };

    const handleMouseUp = () => dragging && setDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  // Auto-close the tip modal
  useEffect(() => {
    const timer = setTimeout(() => setShowTipModal(false), 5000);
    return () => clearTimeout(timer);
  }, []);

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

  // Add custom styles for Quill editor
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .ql-snow .ql-stroke { stroke: white !important; }
    .ql-snow .ql-fill { fill: white !important; }
    .ql-snow .ql-picker { color: white !important; }
    .ql-snow .ql-picker-options {
      background-color: #1e1e26 !important;
      border: none !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4) !important;
      border-radius: 8px !important;
    }
    .ql-snow .ql-picker.ql-expanded .ql-picker-label {
      color: #06d6a0 !important;
      border: none !important;
    }
    .ql-toolbar.ql-snow {
      border: none !important;
      background-color: #17171f !important;
      border-bottom: 1px solid rgba(255,255,255,0.05) !important;
      padding: 8px !important;
      border-radius: 8px 8px 0 0 !important;
    }
    .ql-container.ql-snow {
      border: none !important;
      font-family: 'Inter', sans-serif !important;
      height: calc(100% - 42px) !important;
      border-radius: 0 0 8px 8px !important;
    }
    .ql-editor {
      color: white !important;
      background-color: #1a1a2e !important;
      min-height: 100% !important;
      height: 100% !important;
      padding: 15px 20px !important;
      font-size: 15px !important;
      line-height: 1.6 !important;
    }
    .ql-editor.ql-blank::before {
      color: rgba(255, 255, 255, 0.4) !important;
      font-style: normal !important;
      font-size: 15px !important;
    }
    .ql-snow .ql-active .ql-stroke { stroke: #06d6a0 !important; }
    .ql-snow .ql-active .ql-fill { fill: #06d6a0 !important; }
    .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke { stroke: #06d6a0 !important; }
    .ql-snow .ql-formats button:hover .ql-stroke { stroke: #06d6a0 !important; }
    .ql-snow .ql-formats button:hover .ql-fill { fill: #06d6a0 !important; }
  `;

  document.head.appendChild(styleEl);


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

    // Middle mouse button or Alt+click for panning
    if (e.button === 1 || (e.altKey && e.button === 0)) {
      setIsPanning(true);
      setStartPanPoint({ x: e.clientX, y: e.clientY });
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
    setLastMousePos({ x: e.clientX, y: e.clientY });

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

  // Editor content change handler
  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content);
    if (socketRef.current?.connected) {
      socketRef.current.emit('textUpdate', { roomId, text: content });
    }
  }, [roomId]);

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

  // Get cursor based on current tool
  const getCursorStyle = (): string => {
    if (isPanning) return 'grabbing';
    if (isDrawing) return 'crosshair';

    switch (currentTool) {
      case 'pen': return 'crosshair';
      case 'delete': return 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'white\' stroke=\'gray\' stroke-width=\'1\'%3E%3Crect x=\'3\' y=\'15\' width=\'12\' height=\'8\' rx=\'1\' fill=\'%23f5f5f5\' stroke=\'%23666\'/%3E%3Cpolygon points=\'10,15 15,7 21,10 16,18\' fill=\'%23ff6b6b\' stroke=\'%23666\'/%3E%3C/svg%3E") 3 20, auto';
      default: return 'grab';
    }
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.container} ref={containerRef}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.homeButton} onClick={() => window.location.href = '/'} title="Back to Home">
              ←
            </button>
            <div style={styles.logo}>
              <span style={styles.logoText}>mirror</span>
            </div>
          </div>

          <div style={styles.roomInfo}>
            <span style={styles.roomLabel}>Session ID:</span>
            <span style={styles.roomId}>{roomId}</span>
          </div>

          <div style={styles.actions}>
            <button
              style={{...styles.actionButton, opacity: undoStack.length ? 1 : 0.5}}
              title="Undo"
              onClick={handleUndo}
              disabled={!undoStack.length}
            >
              ↩️
            </button>
            <button
              style={{...styles.actionButton, opacity: redoStack.length ? 1 : 0.5}}
              title="Redo"
              onClick={handleRedo}
              disabled={!redoStack.length}
            >
              ↪️
            </button>
            <button style={styles.actionButton} title="Clear Canvas" onClick={handleClearCanvas}>🗑️</button>
            <button style={styles.actionButton} title="Reset View" onClick={handleResetView}>🔍</button>
            <button style={styles.actionButton} title="Export Canvas" onClick={handleExport}>📥</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.body}>
          <div style={{ ...styles.drawingPad, width: `${dividerPos}%` }}>
            <div style={styles.toolbox}>
              <div style={styles.toolSection}>
                <button
                  style={{
                    ...styles.toolButton,
                    ...(currentTool === 'pen' ? styles.activeTool : {})
                  }}
                  onClick={() => handleToolSelect('pen')}
                  title="Pen Tool"
                >
                  ✏️
                </button>
                <button
                  style={{
                    ...styles.toolButton,
                    ...(currentTool === 'delete' ? styles.activeTool : {})
                  }}
                  onClick={() => handleToolSelect('delete')}
                  title="Eraser Tool"
                >
                  🧽
                </button>
              </div>

              <div style={styles.toolSection}>
                <button
                  style={{
                    ...styles.colorButton,
                    backgroundColor: currentColor,
                    boxShadow: showColorPicker ? '0 0 0 2px #06d6a0' : 'none'
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />

                {showColorPicker && (
                  <div style={styles.colorPicker}>
                    {colors.map(color => (
                      <button
                        key={color}
                        style={{
                          ...styles.colorOption,
                          backgroundColor: color,
                          boxShadow: color === currentColor ? '0 0 0 2px #06d6a0' : 'none'
                        }}
                        onClick={() => {
                          setCurrentColor(color);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.toolSection}>
                <button
                  style={{
                    ...styles.widthButton,
                    boxShadow: showWidthPicker ? '0 0 0 2px #06d6a0' : 'none'
                  }}
                  onClick={() => setShowWidthPicker(!showWidthPicker)}
                >
                  <div style={{
                    width: Math.min(currentWidth * 1.2, 20),
                    height: Math.min(currentWidth * 1.2, 20),
                    borderRadius: '50%',
                    backgroundColor: currentColor,
                  }} />
                </button>

                {showWidthPicker && (
                  <div style={styles.widthPicker}>
                    {[2, 4, 8, 12, 20].map(width => (
                      <button
                        key={width}
                        style={styles.widthOption}
                        onClick={() => {
                          setCurrentWidth(width);
                          setShowWidthPicker(false);
                        }}
                      >
                        <div style={{
                          width: Math.min(width * 1.2, 24),
                          height: Math.min(width * 1.2, 24),
                          borderRadius: '50%',
                          backgroundColor: currentColor
                        }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zoom Controls */}
              <div style={styles.toolSection}>
                <button
                  style={styles.zoomButton}
                  onClick={handleZoomIn}
                  title="Zoom In"
                >

                </button>
                <div style={styles.zoomInfo}>
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  style={styles.zoomButton}
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  -
                </button>
              </div>
            </div>

            <div
              ref={canvasWrapperRef}
              style={styles.canvasWrapper}
              onWheel={handleMouseWheel}
            >
              <div
                style={{
                  ...styles.canvasContainer,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0',
                  cursor: getCursorStyle()
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={styles.canvas}
                  onMouseDown={handleMouseDownCanvas}
                  onMouseMove={handleMouseMoveCanvas}
                  onMouseUp={handleMouseUpCanvas}
                  onMouseLeave={handleMouseUpCanvas}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              </div>

              {showTipModal && (
                <div style={styles.tipModal}>
                  <div style={styles.tipModalContent}>
                    <h3 style={styles.tipTitle}>Pro Tips 🎨</h3>
                    <ul style={styles.tipList}>
                      <li>Use the <strong>pen tool</strong> for smooth vector-like drawing</li>
                      <li>Use the <strong>eraser tool</strong> to remove lines</li>
                      <li>Hold <strong>Alt + Drag</strong> to pan around</li>
                      <li>Use <strong>mouse wheel</strong> to zoom in/out</li>
                      <li>Press <strong>Ctrl+Z</strong> to undo</li>
                    </ul>
                    <button style={styles.tipCloseButton} onClick={() => setShowTipModal(false)}>
                      Got it!
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.panInstructions}>
                Hold Alt + Drag to pan, scroll to zoom
              </div>
            </div>
          </div>

          <div
            style={styles.divider}
            onMouseDown={() => setDragging(true)}
            onDoubleClick={() => setDividerPos(70)}
          >
            <div style={styles.dividerHandle} />
          </div>

          <div style={{ ...styles.textPad, width: `${100 - dividerPos}%` }}>
            <div style={styles.textHeader}>
              <span style={styles.textTitle}>Text Editor</span>
            </div>
            <div style={styles.quillContainer}>
              {typeof window !== 'undefined' ? (
                <ReactQuill
                 preserveWhitespace={true}
                  value={editorContent}
                  onChange={handleEditorChange}
                  modules={quillModules}
                  theme="snow"
                  placeholder="Start typing your notes here..."
                  style={{ height: '100%' }}
                />
              ) : (
                <div style={styles.editorLoading}>Loading editor...</div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.status}>
            <span>Mirror • Collaborative Canvas • {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced styling with more premium aesthetic
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0f0f1a',
    color: '#fff',
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
  },
  header: {
    height: '60px',
    padding: '0 20px',
    backgroundColor: '#0d0d17',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  homeButton: {
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 600,
    fontSize: '26px',
    color: '#06d6a0',
    letterSpacing: '1px',
    fontFamily: 'Inter, monospace',
    textShadow: '0 0 15px rgba(6, 214, 160, 0.3)',
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  roomLabel: {
    fontSize: '14px',
    opacity: 0.7,
  },
  roomId: {
    fontSize: '16px',
    fontWeight: 500,
    padding: '5px 10px',
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    boxShadow: '0 0 15px rgba(6, 214, 160, 0.1)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    padding: '8px 12px',
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '16px',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  drawingPad: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#101028',
  },
  canvasWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasContainer: {
    position: 'absolute',
    willChange: 'transform',
  },
  canvas: {
    backgroundColor: '#1a1a2e',
    display: 'block',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
    borderRadius: '2px',
  },
  textPad: {
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#13132a',
    overflow: 'hidden',
  },
  divider: {
    width: '6px',
    cursor: 'col-resize',
    backgroundColor: '#0a0a1a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    zIndex: 10,
  },
  dividerHandle: {
    width: '3px',
    height: '50px',
    backgroundColor: 'rgba(6, 214, 160, 0.4)',
    borderRadius: '2px',
  },
  textHeader: {
    backgroundColor: '#0f0f1e',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    padding: '10px 15px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
  },
  textTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    opacity: 0.8,
  },
  quillContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 40px)',
    position: 'relative',
    overflow: 'hidden',
  },
  editorLoading: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    backgroundColor: '#1a1a2e',
    height: '100%',
  },
  footer: {
    height: '40px',
    padding: '0 20px',
    backgroundColor: '#0d0d17',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: '14px',
    color: '#06d6a0',
    opacity: 0.7,
  },
  toolbox: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    zIndex: 20,
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(6, 214, 160, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  toolSection: {
    display: 'flex',
    position: 'relative',
    gap: '10px',
    flexWrap: 'wrap',
  },
  toolButton: {
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: '#fff',
    padding: 0,
  },
  activeTool: {
    backgroundColor: 'rgba(6, 214, 160, 0.2)',
    border: '1px solid rgba(6, 214, 160, 0.6)',
    boxShadow: '0 0 15px rgba(6, 214, 160, 0.2)',
    transform: 'translateY(-2px)',
  },
  colorButton: {
    width: '34px',
    height: '34px',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  colorPicker: {
    position: 'absolute',
    top: '50px',
    left: '0',
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    zIndex: 30,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 214, 160, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  colorOption: {
    width: '28px',
    height: '28px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  widthButton: {
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  widthPicker: {
    position: 'absolute',
    top: '50px',
    left: '0',
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 30,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 214, 160, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  widthOption: {
    width: '120px',
    height: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(6, 214, 160, 0.15)',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  tipModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderRadius: '16px',
    padding: '5px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 214, 160, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(6, 214, 160, 0.3)',
  },
  tipModalContent: {
    padding: '25px',
    maxWidth: '350px',
  },
  tipTitle: {
    margin: '0 0 15px 0',
    color: '#06d6a0',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 600,
  },
  tipList: {
    margin: '0 0 20px 0',
    paddingLeft: '20px',
    lineHeight: 1.6,
    color: '#fff',
  },
  tipCloseButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    color: '#06d6a0',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    fontSize: '15px',
  },
  panInstructions: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(10, 10, 25, 0.8)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#ccc',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.3s ease',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
  },
  zoomButton: {
    width: '26px',
    height: '26px',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: '#fff',
  },
  zoomInfo: {
    fontSize: '12px',
    color: '#fff',
    textAlign: 'center',
    minWidth: '40px',
    padding: '4px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  }
};

export default Canvas;