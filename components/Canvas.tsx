import React, { useRef, useState, useEffect } from 'react';
import Head from 'next/head';
import { CanvasProps, Line } from './canvas/types';
import { useSocketConnection } from './canvas/hooks/useSocketConnection';
import { useCanvasInteractions } from './canvas/hooks/useCanvasInteractions';
import { useUndoRedo } from './canvas/hooks/useUndoRedo';
import { useEditor } from './canvas/hooks/useEditor';
import { useUserPresence } from './canvas/hooks/useUserPresence';
import { useCursorTracking } from './canvas/hooks/useCursorTracking';
import RemoteCursors from './canvas/RemoteCursors';
import Header from './canvas/Header';
import Toolbox from './canvas/Toolbox';
import DrawingCanvas from './canvas/DrawingCanvas';
import TextEditor from './canvas/TextEditor';
import styles from './canvas/styles';

const Canvas: React.FC<CanvasProps> = ({ roomId, socket }) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Create socketRef before using hooks
  const socketRef = useRef(socket);

  // UI state
  const [dividerPos, setDividerPos] = useState<number>(70);
  const [dragging, setDragging] = useState(false);
  const [canvasSize] = useState({ width: 2000, height: 1500 });
  
  // CRITICAL: This is the shared state that BOTH socket and canvas interactions use
  const [linesState, setLinesState] = useState<Line[]>([]);
  
  // New state for canvas background and grid
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [showGrid, setShowGrid] = useState(false);
  const [gridColor, setGridColor] = useState('rgba(255, 255, 255, 0.1)');

  // Initialize editor hooks
  const {
    editorContent,
    setEditorContent,
    isEditorReady,
    textVersion,
    setTextVersion,
    isSocketUpdate,
    setIsSocketUpdate,
    quillRef,
    quillModules,
    handleEditorChange,
    handleEditorReady
  } = useEditor({
    roomId,
    socketRef: socketRef,
  });

  // Initialize undo/redo functionality
  const {
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    handleUndo,
    handleRedo
  } = useUndoRedo({ lines: linesState, setLines: setLinesState });

  // Initialize socket connection with shared state
  const {
    historyLoaded,
  } = useSocketConnection({
    socket,
    roomId,
    setLines: setLinesState, // CRITICAL: Use the shared state setter
    setEditorContent,
    setTextVersion,
    setUndoStack,
    setRedoStack,
    textVersion,
    quillRef,
    setIsSocketUpdate
  });
  
  // Initialize user presence tracking
  const { users, currentUser } = useUserPresence({
    socket,
    roomId
  });

  // Initialize canvas interactions first to get panOffset and zoomLevel
  const {
    currentLine,
    currentTool,
    currentWidth,
    setCurrentWidth,
    currentColor,
    setCurrentColor,
    isPanning,
    panOffset,
    lastMousePos,
    zoomLevel,
    eraserRadius,
    setEraserRadius,
    handleMouseDownCanvas,
    handleMouseMoveCanvas,
    handleMouseUpCanvas,
    handleMouseWheel,
    handleZoomIn,
    handleZoomOut,
    handleClearCanvas,
    handleResetView,
    handleToolSelect,
    handleExport
  } = useCanvasInteractions({
    socketRef,
    roomId,
    setUndoStack,
    setRedoStack,
    canvasRef,
    canvasWrapperRef,
    canvasSize,
    historyLoaded,
    lines: linesState,
    setLines: setLinesState // CRITICAL: Use the shared state setter
  });

  // Update the socket reference when socket prop changes
  useEffect(() => { 
    socketRef.current = socket; 
  }, [socket]);

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

  // Initialize cursor tracking after canvas interactions
  const { cursors } = useCursorTracking({
    socket,
    roomId,
    currentUser,
    users,
    containerRef: canvasWrapperRef,
    panOffset,
    zoomLevel
  });

  // Debug logging when lines state changes
  useEffect(() => {
    console.log(`[Canvas.tsx] linesState updated, now has ${linesState.length} lines`);
  }, [linesState]);

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.container} ref={containerRef}>
        {/* Header */}
        <Header 
          roomId={roomId}
          undoStack={undoStack}
          redoStack={redoStack}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearCanvas={handleClearCanvas}
          onResetView={handleResetView}
          onExport={handleExport}
          users={users}
          currentUser={currentUser}
        />

        {/* Main Content */}
        <div style={styles.body}>
          <div style={{ ...styles.drawingPad, width: `${dividerPos}%` }}>
            <Toolbox
              currentTool={currentTool}
              currentColor={currentColor}
              currentWidth={currentWidth}
              zoomLevel={zoomLevel}
              eraserRadius={eraserRadius}
              setEraserRadius={setEraserRadius}
            onToolSelect={handleToolSelect}
            onColorChange={setCurrentColor}
            onWidthChange={setCurrentWidth}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
              // New props for background and grid
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              showGrid={showGrid}
              onToggleGrid={setShowGrid}
              gridColor={gridColor}
              onGridColorChange={setGridColor}
            />

            <DrawingCanvas
              canvasRef={canvasRef}
              canvasWrapperRef={canvasWrapperRef}
              canvasSize={canvasSize}
              lines={linesState}
              currentLine={currentLine}
              isPanning={isPanning}
              isDrawing={false}
              currentTool={currentTool}
              panOffset={panOffset}
              zoomLevel={zoomLevel}
              // New props for background and grid
              backgroundColor={backgroundColor}
              showGrid={showGrid}
              gridColor={gridColor}
              handleMouseDownCanvas={handleMouseDownCanvas}
              handleMouseMoveCanvas={handleMouseMoveCanvas}
              handleMouseUpCanvas={handleMouseUpCanvas}
              handleMouseWheel={handleMouseWheel}
              eraserRadius={eraserRadius}
              lastMousePos={lastMousePos}
            />
            
            {/* Remote cursors - condi onally render when containerRef is available */}
            {canvasWrapperRef.current && (
              <RemoteCursors 
                cursors={cursors || {}} 
                users={users} 
                containerRef={canvasWrapperRef} 
                panOffset={panOffset}
                zoomLevel={zoomLevel}
              />
            )}
          </div>

          <div
            style={styles.divider}
            onMouseDown={() => setDragging(true)}
            onDoubleClick={() => setDividerPos(70)}
          >
            <div style={styles.dividerHandle} />
          </div>

          <div style={{ width: `${100 - dividerPos}%` }}>
            <TextEditor
              quillRef={quillRef}
              editorContent={editorContent}
              quillModules={quillModules}
              handleEditorChange={handleEditorChange}
              handleEditorReady={handleEditorReady}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Canvas;
