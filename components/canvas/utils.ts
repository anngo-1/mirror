import { Line, Point, DrawingTool } from './types';

// Function to check if a point is on a line
export const isPointNearLine = (point: {x: number, y: number}, line: Line, threshold: number): boolean => {
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

// Function to smooth lines using the Catmull-Rom spline algorithm
export const smoothLine = (points: Point[]): Point[] => {
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
export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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
export const drawLines = (ctx: CanvasRenderingContext2D, lines: Line[]) => {
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

// Get cursor based on current tool
export const getCursorStyle = (isPanning: boolean, isDrawing: boolean, currentTool: DrawingTool): string => {
  if (isPanning) return 'grabbing';
  if (isDrawing) return 'crosshair';

  switch (currentTool) {
    case 'pen': return 'crosshair';
    case 'delete': return 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'white\' stroke=\'gray\' stroke-width=\'1\'%3E%3Crect x=\'3\' y=\'15\' width=\'12\' height=\'8\' rx=\'1\' fill=\'%23f5f5f5\' stroke=\'%23666\'/%3E%3Cpolygon points=\'10,15 15,7 21,10 16,18\' fill=\'%23ff6b6b\' stroke=\'%23666\'/%3E%3C/svg%3E") 3 20, auto';
    default: return 'grab';
  }
};

