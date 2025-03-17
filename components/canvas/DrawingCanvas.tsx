import React, { useEffect, useState, WheelEvent } from 'react';
import { 
  Text, 
  List, 
  Button, 
  Modal,
} from '@mantine/core';
import { DrawingTool, Line } from './types';
import { getCursorStyle } from './utils';

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  canvasSize: { width: number; height: number };
  lines: Line[];
  currentLine: Line;
  isPanning: boolean;
  isDrawing: boolean;
  currentTool: DrawingTool;
  panOffset: { x: number; y: number };
  zoomLevel: number;
  eraserRadius: number;
  lastMousePos: { x: number; y: number };
  backgroundColor?: string; // New prop for background color
  showGrid?: boolean; // New prop for showing grid
  gridColor?: string; // New prop for grid color
  handleMouseDownCanvas: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMoveCanvas: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUpCanvas: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseWheel: (e: WheelEvent<HTMLDivElement>) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasRef,
  canvasWrapperRef,
  canvasSize,
  lines,
  currentLine,
  isPanning,
  isDrawing,
  currentTool,
  panOffset,
  zoomLevel,
  eraserRadius,
  lastMousePos,
  backgroundColor = '#000000',
  showGrid = false,
  gridColor = 'rgba(255, 255, 255, 0.1)',
  handleMouseDownCanvas,
  handleMouseMoveCanvas,
  handleMouseUpCanvas,
  handleMouseWheel
}) => {
  const [showTipModal, setShowTipModal] = useState(true);
  const [clientMousePos, setClientMousePos] = useState({ x: 0, y: 0 });
  
  // Track mouse position with client coordinates
  useEffect(() => {
    const trackMouse = (e: MouseEvent) => {
      setClientMousePos({ x: e.clientX, y: e.clientY });
      console.log("Mouse moved:", e.clientX, e.clientY);
    };
    
    // Immediately set initial position
    if (typeof window !== 'undefined') {
      setClientMousePos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
    
    window.addEventListener('mousemove', trackMouse);
    return () => window.removeEventListener('mousemove', trackMouse);
  }, []);

  // Function to smooth lines using the Catmull-Rom spline algorithm
  const smoothLine = (points: Line): Line => {
    if (points.length < 3) return points;

    const smoothed: Line = [];

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
        const t3 = t2 * t;

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

  // Helper function to draw grid
  const drawGridDirectly = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Skip drawing grid if disabled
    if (!showGrid) return;
    
    ctx.strokeStyle = gridColor;
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
  const drawLinesDirectly = (ctx: CanvasRenderingContext2D, lines: Line[]) => {
    console.log(`DRAWING ${lines.length} LINES DIRECTLY WITH OUR NEW FUNCTION`);
    
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

  // Canvas drawing logic
  useEffect(() => {
    console.log(`[CRITICAL] DrawingCanvas useEffect triggered with ${lines.length} lines`);
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("[Canvas] Canvas ref is null");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("[Canvas] Failed to get canvas context");
      return;
    }

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw background with selected color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grid pattern if enabled
    drawGridDirectly(ctx, canvas.width, canvas.height);

    // Check if lines exist and log details
    if (lines && Array.isArray(lines)) {
      console.log(`[CRITICAL] Drawing ${lines.length} lines`);
      if (lines.length > 0) {
        const firstLine = lines[0];
        console.log(`[CRITICAL] First line has ${firstLine.length} points`);
        console.log(`[CRITICAL] First point:`, JSON.stringify(firstLine[0]));
      }
    } else {
      console.error("[CRITICAL] Lines is not an array:", lines);
    }

    // Draw all lines
    try {
      drawLinesDirectly(ctx, lines);
    } catch (e) {
      console.error("[CRITICAL] Error drawing lines:", e);
    }

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
  }, [lines, currentLine, canvasSize, showGrid, gridColor, backgroundColor]);

  return (
    <div
      ref={canvasWrapperRef}
      className="relative w-full h-full overflow-hidden bg-[#080820]"
      onWheel={handleMouseWheel}
    >
      {/* Note: For 50% zoom, the default zoomLevel would need to be 0.5 in the parent component */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          cursor: getCursorStyle(isPanning, isDrawing, currentTool)
        }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onMouseLeave={handleMouseUpCanvas}
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </div>
      
      {/* Eraser cursor - Only visible with delete tool */}
      {currentTool === 'delete' && (
        <>
          {/* Outer ring - visible on both dark and light backgrounds with thicker border */}
          <div 
            style={{
              position: 'fixed',
              left: `${clientMousePos.x}px`,
              top: `${clientMousePos.y}px`,
              width: `${eraserRadius * 2 + 8}px`,
              height: `${eraserRadius * 2 + 8}px`,
              border: '4px solid rgba(0, 0, 0, 0.8)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 99998,
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)'
            }}
          />
          {/* Inner circle with gradient */}
          <div 
            style={{
              position: 'fixed',
              left: `${clientMousePos.x}px`,
              top: `${clientMousePos.y}px`,
              width: `${eraserRadius * 2}px`,
              height: `${eraserRadius * 2}px`,
              background: 'radial-gradient(circle, rgba(65, 185, 255, 0.3) 0%, rgba(65, 105, 225, 0.5) 100%)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 99999
            }}
          />
        </>
      )}

      {/* Tip Modal */}
      <Modal
        opened={showTipModal}
        onClose={() => setShowTipModal(false)}
        title="Pro Tips 🎨"
        centered
        overlayProps={{
          color: '#080820',
          opacity: 0.7,
          blur: 3
        }}
        styles={{
          root: {
            '--modal-bg': '#13132a'
          },
          header: {
            backgroundColor: '#13132a',
            borderBottom: 'none'
          },
          title: {
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#06d6a0'
          },
          body: {
            backgroundColor: '#13132a',
            color: 'white'
          },
          close: {
            color: '#06d6a0',
            '&:hover': {
              backgroundColor: 'rgba(6, 214, 160, 0.1)'
            }
          },
          content: {
            backgroundColor: '#13132a',
            border: '1px solid rgba(6, 214, 160, 0.2)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)'
          },
          inner: {
            padding: '20px 0'
          }
        }}
      >
        <List
          spacing="xs"
          size="sm"
          center
          styles={{
            item: { color: 'white' },
            itemWrapper: { backgroundColor: '#13132a' },
            itemLabel: { color: 'white' }
          }}
        >
          <List.Item>Use the <Text span fw={700} c="#06d6a0">pen tool</Text> for smooth vector-like drawing</List.Item>
          <List.Item>Use the <Text span fw={700} c="#06d6a0">eraser tool</Text> to remove lines</List.Item>
          <List.Item>Hold <Text span fw={700} c="#06d6a0">Alt + Drag</Text> to pan around</List.Item>
          <List.Item>Use the <Text span fw={700} c="#06d6a0">mouse wheel</Text> to zoom in/out</List.Item>
          <List.Item>Press <Text span fw={700} c="#06d6a0">Ctrl+Z</Text> to undo</List.Item>
          <List.Item>Change <Text span fw={700} c="#06d6a0">background & grid</Text> in the toolbox</List.Item>
        </List>
        
        <Button
          onClick={() => setShowTipModal(false)}
          mt="md"
          fullWidth
          styles={{
            root: {
              backgroundColor: '#06d6a0',
              color: '#13132a',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#05c090'
              }
            }
          }}
        >
          Got it!
        </Button>
      </Modal>

      {/* Pan instructions */}
      <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 py-2 px-4 bg-black/40 text-white/70 rounded text-xs pointer-events-none opacity-70">
        Hold Alt + Drag to pan, scroll to zoom
      </div>
    </div>
  );
};

export default DrawingCanvas;