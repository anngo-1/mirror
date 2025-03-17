import React, { useEffect, useState, WheelEvent } from 'react';
import { DrawingTool, Line } from './types';
import { getCursorStyle, drawLines, drawGrid } from './utils';
import styles from './styles';

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
  handleMouseDownCanvas,
  handleMouseMoveCanvas,
  handleMouseUpCanvas,
  handleMouseWheel
}) => {
  const [showTipModal, setShowTipModal] = useState(true);

  // Auto-close the tip modal
  useEffect(() => {
    const timer = setTimeout(() => setShowTipModal(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Function to smooth lines using the Catmull-Rom spline algorithm - COPIED DIRECTLY FROM WORKING EXAMPLE
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

  // Helper function to draw grid - COPIED DIRECTLY FROM WORKING EXAMPLE
  const drawGridDirectly = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  // Helper function to draw lines - COPIED DIRECTLY FROM WORKING EXAMPLE
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

  // Canvas drawing logic - COMPLETELY copied from working example
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

    // Draw premium background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#111122');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grid pattern
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
  }, [lines, currentLine, canvasSize]);

  return (
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
          cursor: getCursorStyle(isPanning, isDrawing, currentTool)
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
  );
};

export default DrawingCanvas;
