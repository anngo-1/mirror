export const config = { api: { bodyParser: false } };
import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

// Define drawing data type
interface DrawingData {
  roomId: string;
  line: Point[];
}

interface Point {
  x: number;
  y: number;
}


// Global object to store drawing history and text content for each room
const roomHistories: { [roomId: string]: DrawingData[] } = {};
const roomTexts: { [roomId: string]: string } = {};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  // Ensure that res.socket exists
  if (!res.socket) {
    return res.end();
  }

  // Cast res.socket to any to access the underlying server instance
  const socketServer = res.socket as any;

  // Initialize Socket.io server if not already initialized
  if (!socketServer.server?.io) {
    console.log("Initializing Socket.io server...");
    
    const io = new Server(socketServer.server, {
      path: "/api/socket/io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    
    socketServer.server.io = io;

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      
      socket.on("joinRoom", (roomId: string) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);
        
        // Leave any previous rooms
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room);
          }
        }
        
        socket.join(roomId);
        
        // Store the current room on socket instance
        (socket as any).currentRoom = roomId;
        
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Initialize room history and text if they don't exist
        if (!roomHistories[roomId]) {
          roomHistories[roomId] = [];
        }
        if (!roomTexts[roomId]) {
          roomTexts[roomId] = '';
        }
        
        console.log(`Sending history to socket ${socket.id}, history length: ${roomHistories[roomId].length}`);
        
        // Send the existing drawing history and text to the newly joined client
        socket.emit("history", { lines: roomHistories[roomId], text: roomTexts[roomId], roomId });
      });

      socket.on("drawing", (data: DrawingData) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        
        if (roomId) {
          if (!roomHistories[roomId]) {
            roomHistories[roomId] = [];
          }
          
          // Store the drawing data
          roomHistories[roomId].push(data);
          
          // Broadcast the drawing event to all other clients in the room
          socket.to(roomId).emit("drawing", data);
        }
      });

      socket.on("clearCanvas", (data: { roomId: string }) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        
        if (roomId) {
          // Clear drawing history for the room
          roomHistories[roomId] = [];
          
          // Broadcast the clear event to all other clients in the room
          io.to(roomId).emit("clearCanvas", data); // Use io.to to include sender
        }
      });
      
      socket.on('textUpdate', (data: { text: string; roomId: string }) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        if (roomId) {
          roomTexts[roomId] = data.text;
          io.to(roomId).emit('textUpdate', data);
        }
      });

      socket.on('requestHistory', (data: { roomId: string }) => {
        const roomId = data.roomId || (socket as any).currentRoom;
        if (roomId) {
          socket.emit('history', { lines: roomHistories[roomId], text: roomTexts[roomId], roomId });
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  res.end();
};

export default SocketHandler;
