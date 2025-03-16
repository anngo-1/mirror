import React, { useRef, useState, useEffect, MouseEvent } from 'react';
import { Socket } from 'socket.io-client';

export interface CanvasProps {
  roomId: string;
  socket: Socket;
}

interface Point {
  x: number;
  y: number;
}

type Line = Point[];

const Canvas: React.FC<CanvasProps> = ({ roomId, socket }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textContent, setTextContent] = useState('');
  // divider state: percentage width for drawing pad (left panel)
  const [dividerPos, setDividerPos] = useState<number>(70);
  const [dragging, setDragging] = useState(false);

  // Listen for external drawing and text events
  useEffect(() => {
    if (!socket) return;

    socket.on('drawing', (data: { line: Line; roomId: string }) => {
      if (data.roomId === roomId) {
        setLines(prev => [...prev, data.line]);
      }
    });

    socket.on('clearCanvas', (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setLines([]);
      }
    });

    socket.on('textUpdate', (data: { text: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setTextContent(data.text);
      }
    });

    return () => {
      socket.off('drawing');
      socket.off('clearCanvas');
      socket.off('textUpdate');
    };
  }, [socket, roomId, textContent]);

  // Load session history on join
  useEffect(() => {
    if (!socket) return;
    
    const handleHistory = (data: { lines: Line[]; text: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setLines(data.lines || []);
        setTextContent(data.text || '');
      }
    };

    socket.emit('requestHistory', { roomId });
    socket.on('history', handleHistory);

    return () => {
      socket.off('history', handleHistory);
    };
  }, [socket, roomId]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Resize canvas to fit container without scrolling
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    context.fillStyle = '#1e1e1e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = 'round';
    context.strokeStyle = '#fff';
    context.lineWidth = 2;

    // Draw completed lines
    lines.forEach(line => {
      if (line.length > 0) {
        context.beginPath();
        line.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
      }
    });

    // Draw current line
    if (currentLine.length > 0) {
      context.beginPath();
      currentLine.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    }
  }, [lines, currentLine]);

  // Handle divider dragging with proper type for window events
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (dragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let newDivider = ((e.clientX - rect.left) / rect.width) * 100;
        newDivider = Math.max(30, Math.min(90, newDivider));
        setDividerPos(newDivider);
      }
    };
    const handleMouseUp = (e: globalThis.MouseEvent) => {
      if (dragging) setDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  const getRelativePos = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDownCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getRelativePos(e);
    setCurrentLine([pos]);
    setIsDrawing(true);
  };

  const handleMouseMoveCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getRelativePos(e);
    setCurrentLine(prev => [...prev, pos]);
  };

  const handleMouseUpCanvas = () => {
    if (isDrawing && currentLine.length > 0) {
      setLines(prev => [...prev, currentLine]);
      socket.emit('drawing', { roomId, line: currentLine });
      setCurrentLine([]);
      setIsDrawing(false);
    }
  };

  const handleClearCanvas = () => {
    setLines([]);
    socket.emit('clearCanvas', { roomId });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Immediate update: no debounce delay to ensure real-time collaboration
    debounceRef.current = setTimeout(() => {
      socket.emit('textUpdate', { roomId, text: newText });
    }, 0);
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.header}>
        <div style={styles.info}>
          Room: {roomId}
          <button style={styles.clearButton} onClick={handleClearCanvas}>Clear</button>
        </div>
      </div>
      <div style={styles.body}>
        <div style={{ ...styles.drawingPad, width: `${dividerPos}%` }}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            onMouseLeave={handleMouseUpCanvas}
          />
        </div>
        <div style={styles.divider} onMouseDown={() => setDragging(true)} />
        <div style={{ ...styles.textPad, width: `${100 - dividerPos}%` }}>
          <textarea
            style={styles.textArea}
            placeholder="Collaborative Text Pad..."
            value={textContent}
            onChange={handleTextChange}
          />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    display: 'flex',
    flexDirection: 'column',
    border: 'none',
  },
  header: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2e2e2e',
    textAlign: 'center',
  },
  info: {
    fontSize: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  clearButton: {
    padding: '6px 10px',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  body: {
    width: '100%',
    height: 'calc(100vh - 50px)',
    display: 'flex',
    flexDirection: 'row',
  },
  drawingPad: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  textPad: {
    height: '100%',
    position: 'relative',
  },
  divider: {
    width: '5px',
    cursor: 'col-resize',
    backgroundColor: '#444',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1e1e',
    display: 'block',
    cursor: 'crosshair',
    border: 'none',
  },
  textArea: {
    width: '100%',
    height: '100%',
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#2e2e2e',
    color: '#fff',
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    border: 'none',
  },
};

export default Canvas;
