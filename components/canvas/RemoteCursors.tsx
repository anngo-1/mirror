import React from 'react';
import { createPortal } from 'react-dom';
import { RoomUser } from './hooks/useUserPresence';

// Match the interface used in useCursorTracking.ts
interface CursorPosition {
  canvasX: number;
  canvasY: number;
  userId: string;
}

interface RemoteCursorsProps {
  cursors: {[key: string]: CursorPosition};
  users: RoomUser[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}

const RemoteCursors: React.FC<RemoteCursorsProps> = ({ cursors, users, containerRef, panOffset, zoomLevel }) => {
  if (!containerRef.current) return null;
  
  return createPortal(
    <>
      {Object.values(cursors).map(cursor => {
        // Find user information for this cursor
        const user = users.find(u => u.id === cursor.userId);
        if (!user) return null;
        
        // Convert canvas coordinates to screen coordinates
        const screenX = cursor.canvasX * zoomLevel + panOffset.x;
        const screenY = cursor.canvasY * zoomLevel + panOffset.y;
        
        // Log for debugging
        console.log('Rendering cursor:', { 
          canvasX: cursor.canvasX, 
          canvasY: cursor.canvasY, 
          screenX, 
          screenY,
          userId: cursor.userId,
          userName: user.name
        });
        
        return (
          <div
            key={cursor.userId}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              pointerEvents: 'none',
              zIndex: 9999,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.1s ease-out, top 0.1s ease-out'
            }}
          >
            {/* Custom cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
              }}
            >
              <path
                d="M5 2L19 12L12 13.5L9.5 20.5L5 2Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            
            {/* User label */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '10px',
                backgroundColor: user.color,
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 'bold',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </>,
    containerRef.current
  );
};

export default RemoteCursors;
