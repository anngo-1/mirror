// app/api/socket/route.ts
import { Server as NetServer } from 'http';
import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

// Define drawing data type
interface DrawingData {
  roomId: string;
  lastX: number;
  lastY: number;
  x: number;
  y: number;
  color?: string;
  lineWidth?: number;
}

// Global object to store drawing history for each room
const roomHistories: { [roomId: string]: DrawingData[] } = {};

// Global SocketIO instance
let io: SocketIOServer;

function initSocketServer(res: any) {
  if (!io) {
    // Create a new SocketIO instance
    const httpServer: NetServer = res.socket.server;
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      socket.on('joinRoom', (roomId: string) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);
        
        // Leave any previous rooms
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room);
          }
        }
        
        socket.join(roomId);
        
        // Store the current room on socket instance for reference
        (socket as any).currentRoom = roomId;
        
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Initialize room history if it doesn't exist
        if (!roomHistories[roomId]) {
          roomHistories[roomId] = [];
        }
        
        console.log(`Sending history to socket ${socket.id}, history length: ${roomHistories[roomId].length}`);
        
        // Send existing drawing history to the newly joined client
        socket.emit('history', roomHistories[roomId]);
      });

      socket.on('drawing', (data: DrawingData) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        
        if (roomId) {
          if (!roomHistories[roomId]) {
            roomHistories[roomId] = [];
          }
          
          // Store the drawing data
          roomHistories[roomId].push(data);
          
          // Broadcast the drawing event to all other clients in the room
          socket.to(roomId).emit('drawing', data);
        }
      });

      socket.on('clear', (data: { roomId: string }) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        
        if (roomId) {
          // Clear drawing history for the room
          roomHistories[roomId] = [];
          
          // Broadcast the clear event to all other clients in the room
          socket.to(roomId).emit('clear');
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
}

// Configure API route options
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const res = new Response(
    JSON.stringify({ message: 'Socket.io server is running' }),
    {
      headers: {
        'content-type': 'application/json',
      },
    }
  );

  // @ts-ignore - res has no socket property
  initSocketServer(res);

  return res;
}

export async function POST(req: NextRequest) {
  const res = new Response(
    JSON.stringify({ message: 'Socket.io server is running' }),
    {
      headers: {
        'content-type': 'application/json',
      },
    }
  );

  // @ts-ignore - res has no socket property
  initSocketServer(res);

  return res;
}