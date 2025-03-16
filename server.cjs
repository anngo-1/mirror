// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room histories for storing drawing data
const roomHistories = {};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Import and initialize Socket.io
  const { Server } = require('socket.io');
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('joinRoom', (roomId) => {
      console.log(`Socket ${socket.id} joining room ${roomId}`);
      
      // Leave any previous rooms
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }
      
      socket.join(roomId);
      
      // Store the current room on socket
      socket.currentRoom = roomId;
      
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Initialize room history if it doesn't exist
      if (!roomHistories[roomId]) {
        roomHistories[roomId] = [];
      }
      
      console.log(`Sending history to socket ${socket.id}, history length: ${roomHistories[roomId].length}`);
      
      // Send the existing drawing history to the newly joined client
      socket.emit('history', roomHistories[roomId]);
    });

    socket.on('drawing', (data) => {
      const roomId = data.roomId || socket.currentRoom;
      
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

    socket.on('clear', (data) => {
      const roomId = data.roomId || socket.currentRoom;
      
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

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});