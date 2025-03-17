import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { RoomUser } from './useUserPresence';

// Store absolute canvas coordinates
interface CursorPosition {
  canvasX: number; // Canvas x coordinate (absolute)
  canvasY: number; // Canvas y coordinate (absolute)
  userId: string;
}

interface CursorTrackingParams {
  socket: Socket;
  roomId: string;
  currentUser: RoomUser | null;
  users: RoomUser[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}

export const useCursorTracking = ({ 
  socket, 
  roomId, 
  currentUser, 
  users,
  containerRef,
  panOffset,
  zoomLevel
}: CursorTrackingParams) => {
  // Store users' cursor positions in canvas coordinates
  const [cursors, setCursors] = useState<{[key: string]: CursorPosition}>({});
  
  // Handle mouse movement (main tracking logic)
  useEffect(() => {
    if (!socket || !containerRef.current || !currentUser) return;
    
    // Set up throttling for cursor updates
    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Get mouse position relative to the container
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      // Convert to absolute canvas coordinates
      // This is the key conversion - we're translating from view coordinates to canvas coordinates
      const canvasX = (screenX - panOffset.x) / zoomLevel;
      const canvasY = (screenY - panOffset.y) / zoomLevel;
      
      // Log all values for debugging
      console.log('Mouse position:', {
        screen: { x: screenX, y: screenY },
        canvas: { x: canvasX, y: canvasY },
        pan: panOffset,
        zoom: zoomLevel
      });
      
      // Throttle updates to reduce network traffic
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          if (socket.connected) {
            // Send absolute canvas coordinates
            socket.emit('cursorPosition', {
              roomId,
              canvasX,
              canvasY
            });
          }
          throttleTimeout = null;
        }, 33); // ~30 updates per second
      }
    };
    
    // Attach event listener
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Clean up
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [socket, containerRef.current, currentUser, panOffset, zoomLevel, roomId]);
  
  // Handle cursor updates from server
  useEffect(() => {
    if (!socket) return;
    
    const handleCursorUpdate = (data: { 
      roomId: string; 
      userId: string; 
      canvasX: number; 
      canvasY: number;
    }) => {
      if (data.roomId !== roomId || data.userId === currentUser?.id) return;
      
      // Store the absolute canvas coordinates
      setCursors(prev => ({
        ...prev,
        [data.userId]: {
          canvasX: data.canvasX,
          canvasY: data.canvasY,
          userId: data.userId
        }
      }));
    };
    
    const handleUserLeft = (data: { roomId: string; userId: string }) => {
      if (data.roomId !== roomId) return;
      
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[data.userId];
        return newCursors;
      });
    };
    
    socket.on('cursorUpdate', handleCursorUpdate);
    socket.on('userLeft', handleUserLeft);
    
    return () => {
      socket.off('cursorUpdate', handleCursorUpdate);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket, roomId, currentUser]);

  return { cursors };
};
