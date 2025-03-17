import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Line } from '../types';

interface UseSocketConnectionParams {
  socket: Socket;
  roomId: string;
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
  setTextVersion: React.Dispatch<React.SetStateAction<number>>;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<any[]>>;
  textVersion: number;
  quillRef: React.MutableRefObject<any>;
  setIsSocketUpdate: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSocketConnection = ({
  socket,
  roomId,
  setLines,
  setEditorContent,
  setTextVersion,
  setUndoStack,
  setRedoStack,
  textVersion,
  quillRef,
  setIsSocketUpdate,
}: UseSocketConnectionParams) => {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Store socket reference
  useEffect(() => { 
    socketRef.current = socket; 
  }, [socket]);

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

  // Handle incoming history data with more robust approach
  useEffect(() => {
    if (!socket) return;

    const handleHistory = (data: any) => {
      try {
        if (data && typeof data === 'object') {
          if (!data.roomId || data.roomId === roomId) {
            // Process lines with better validation and logging - matching the working example
            if (data.lines && Array.isArray(data.lines)) {
              console.log("[Canvas] handleHistory: Received 'history' event from server");
              
              // This is crucial - make sure we're receiving and processing the lines correctly
              console.log("[Canvas] handleHistory: Lines data received:", JSON.stringify(data.lines));
              
              // Crucial: Format validation, creating proper Line[] type
              const validLines = data.lines
                .filter((line: any) => Array.isArray(line) && line.length > 0)
                .map((line: any) => {
                  // Ensure each point in the line has the correct structure
                  return line.map((point: any) => ({
                    x: Number(point.x),
                    y: Number(point.y),
                    color: point.color || '#ffffff',
                    width: Number(point.width) || 3
                  }));
                });
              
              console.log("[Canvas] handleHistory: Processed validLines:", 
                validLines.length > 0 
                  ? `First line has ${validLines[0].length} points: ${JSON.stringify(validLines[0][0])}`
                  : "No valid lines");
              
              // Crucial: Update state with validated and properly formatted lines
              setLines(validLines);
              console.log("[Canvas] handleHistory: Lines state updated with", validLines.length, "lines");
            } else if (Array.isArray(data)) {
              console.log(`[Canvas] handleHistory: Received array format with ${data.length} items`);
              const validLines = data.filter((line: any) => Array.isArray(line) && line.length > 0);
              console.log(`[Canvas] handleHistory: After filtering, ${validLines.length} valid lines remain`);
              setLines(validLines);
            } else {
              console.log("[Canvas] handleHistory: No valid line data found, clearing canvas");
              setLines([]);
            }

            // Process content with robust handling
            if (data.text !== undefined) {
              console.log(`[Canvas] handleHistory: Setting editor content from history (${data.text.length} chars)`);
              setIsSocketUpdate(true);
              setEditorContent(data.text);
            }

            setHistoryLoaded(true);
          }
        }
      } catch (err) {
        console.error("[Canvas] Error processing history data:", err);
        // Fallback to empty state on error
        setLines([]);
        setHistoryLoaded(true);
      }
    };

    socket.on('history', handleHistory);

    // Request history until received
    const requestInterval = setInterval(() => {
      if (!historyLoaded && socket.connected) {
        console.log("[Canvas] Requesting history...");
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
  }, [socket, roomId, historyLoaded, setLines, setEditorContent, setIsSocketUpdate]);

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

    // Add a new handler for delta updates
    const handleTextDelta = (data: { delta: any; roomId: string; version: number }) => {
      if (data.roomId === roomId && quillRef.current) {
        // Apply the delta only if the version is expected or off by just 1
        const versionDiff = Math.abs(data.version - textVersion);
        
        if (versionDiff <= 1) {
          console.log(`[Canvas] handleTextDelta: Applying delta (version diff: ${versionDiff})`);
          
          // Set a flag to avoid emitting the change back
          setIsSocketUpdate(true);
          
          try {
            // Get the quill editor instance
            const quill = quillRef.current.getEditor();
            
            // Apply the delta to update the text without disturbing the cursor
            quill.updateContents(data.delta);
            
            // Ensure our version is now in sync with what's expected
            setTextVersion(data.version + 1);
            
            // Force periodic full sync to ensure consistency
            if (socketRef.current?.connected) {
              const content = quill.getText();
              socketRef.current.emit('textUpdate', { 
                roomId, 
                text: content,
                forceSync: true
              });
              lastSyncTimeRef.current = Date.now();
            }
          } catch (err) {
            console.error("[Canvas] Error applying delta:", err);
            // On error, request full history
            socket.emit('requestHistory', { roomId });
          }
        } else {
          console.log(`[Canvas] handleTextDelta: Version mismatch too large (diff: ${versionDiff}), requesting history`);
          socket.emit('requestHistory', { roomId });
          
          // Update our version to match what was received (+1) to avoid future conflicts
          setTextVersion(data.version + 1);
        }
      }
    };
    
    // A simplified handler for text updates
    const handleTextUpdate = (data: { text: string; roomId: string; selection?: any }) => {
      if (data.roomId === roomId) {
        console.log("[Canvas] Received textUpdate from server");
        
        // Set flag to prevent loop
        setIsSocketUpdate(true);
        
        // Update React state first
        setEditorContent(data.text);
        
        // Then try to update Quill directly if it's available
        if (quillRef.current) {
          try {
            const quill = quillRef.current.getEditor();
            const currentSelection = quill.getSelection();
            
            // Force editor content update
            quill.setContents([]); // Clear
            quill.clipboard.dangerouslyPasteHTML(0, data.text);
            
            // Restore cursor position after rendering
            setTimeout(() => {
              if (currentSelection) {
                quill.setSelection(currentSelection);
              }
              setIsSocketUpdate(false);
            }, 10);
          } catch (err) {
            console.error("[Canvas] Error updating editor:", err);
            setIsSocketUpdate(false);
          }
        } else {
          setIsSocketUpdate(false);
        }
      }
    };

    // Register event handlers
    const events = {
      'drawing': handleDrawing,
      'clearCanvas': handleClearCanvas,
      'textUpdate': handleTextUpdate,
      'textDelta': handleTextDelta
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
  }, [socket, roomId, textVersion, setLines, setUndoStack, setRedoStack, setTextVersion, quillRef, setEditorContent, setIsSocketUpdate]);

  return {
    historyLoaded,
    socketRef,
    lastSyncTimeRef,
  };
};
