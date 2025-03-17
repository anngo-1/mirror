const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const hostname = process.env.HOST || '0.0.0.0';

const app = next({ dev });
const handle = app.getRequestHandler();

const roomHistories = {};
const roomTexts = {};
const roomTextVersions = {};
const roomUsers = {}; // Track users in each room with their assigned numbers
const roomUserIds = {}; // Map socket IDs to user numbers for consistency
const roomNextUserNumber = {}; // Track the next available user number for each room
const roomCursors = {}; // Track cursor positions for each user

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

  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    maxHttpBufferSize: 1e8 
  });

  const activeRooms = new Set();

  io.on('connection', (socket) => {
    // Store user object for this socket
    let currentUser = null;
    socket.on('joinRoom', (roomId) => {
      // leave any previous rooms
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      socket.join(roomId);
      activeRooms.add(roomId);

      // store the current room on socket
      socket.currentRoom = roomId;

      // Initialize room users if it doesn't exist
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      // Send the list of current users in the room to the newly joined client
      socket.emit('usersInRoom', {
        roomId,
        users: roomUsers[roomId]
      });

      // initialize room history if it doesn't exist
      if (!roomHistories[roomId]) {
        roomHistories[roomId] = [];
      }

      // initialize room text if it doesn't exist
      if (!roomTexts[roomId]) {
        roomTexts[roomId] = '';
      }

      // Initialize room text version if it doesn't exist
      if (!roomTextVersions[roomId]) {
        roomTextVersions[roomId] = 0;
      }

      // send the existing drawing history and text to the newly joined client
      socket.emit('history', {
        lines: roomHistories[roomId],
        text: roomTexts[roomId],
        roomId
      });
      
      console.log(`Client joined room: ${roomId}, Socket ID: ${socket.id}`);
    });

    socket.on('drawing', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) {
          console.error('[Error] Drawing event: No roomId provided or stored');
          return;
        }

        if (data.line && Array.isArray(data.line)) {
          // Initialize room history if it doesn't exist
          if (!roomHistories[roomId]) {
            console.log(`[Server] Creating new room history for ${roomId}`);
            roomHistories[roomId] = [];
          }

          // Validate line data before storing
          if (data.line.length > 0) {
            // Store the drawing data (the line)
            roomHistories[roomId].push(data.line);
            console.log(`[Server] Added new line to room ${roomId}, now has ${roomHistories[roomId].length} lines`);

            // Send to other clients in the room
            socket.to(roomId).emit('drawing', data);
          } else {
            console.log(`[Server] Received empty line data, not storing`);
          }
        } else {
          console.error('[Error] Drawing event: Invalid line data format');
        }
      } catch (err) {
        console.error('[Error] Drawing event:', err.message);
      }
    });

    socket.on('eraseDrawing', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) {
          console.error('[Error] Erase drawing event: No roomId provided or stored');
          return;
        }

        if (data.lines && Array.isArray(data.lines)) {
          console.log(`[Server] Erasing drawings for room ${roomId}, replacing with ${data.lines.length} lines`);
          
          // Store the updated lines array after erasing
          roomHistories[roomId] = data.lines.filter(line => Array.isArray(line) && line.length > 0);
          
          // Broadcast to all clients in the room including sender to ensure consistency
          io.to(roomId).emit('history', { 
            roomId, 
            lines: roomHistories[roomId],
            text: roomTexts[roomId] || ''
          });
          
          console.log(`[Server] Updated history broadcast after erase operation`);
        } else {
          console.error('[Error] Erase drawing event: Invalid lines data format');
        }
      } catch (err) {
        console.error('[Error] Erase drawing event:', err.message);
      }
    });

    socket.on('clearCanvas', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        roomHistories[roomId] = [];

        io.to(roomId).emit('clearCanvas', { roomId });
      } catch (err) {
        console.error('[Error] Clear canvas event:', err.message);
      }
    });

    // REMOVE delta handling completely due to issues
    socket.on('textDelta', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;
        
        console.log('[Warning] Received textDelta but delta handling is disabled. Using full text sync instead.');
        
        // If we have text, update it
        if (data.text) {
          roomTexts[roomId] = data.text;
          socket.to(roomId).emit('textUpdate', { roomId, text: data.text });
        }
      } catch (err) {
        console.error('[Error] Text delta event:', err.message);
      }
    });

    // SIMPLIFIED: Full text updates with preservation of cursor
    socket.on('textUpdate', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        // Store the full text
        roomTexts[roomId] = data.text;
        
        // Forward to other clients with cursor position
        socket.to(roomId).emit('textUpdate', { 
          roomId, 
          text: data.text,
          selection: data.selection
        });
        
        console.log(`Stored & broadcasted text update for room ${roomId}, ${data.text.length} chars`);
        
      } catch (err) {
        console.error('[Error] Text update event:', err.message);
      }
    });

    socket.on('requestHistory', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        // Ensure room data exists
        if (!roomHistories[roomId]) roomHistories[roomId] = [];
        if (!roomTexts[roomId]) roomTexts[roomId] = '';

        const historyLines = roomHistories[roomId];
        const historyText = roomTexts[roomId];
        
        console.log(`[Server] Sending history to client in room ${roomId}:`);
        console.log(`[Server] - Lines count: ${historyLines.length}`);
        console.log(`[Server] - First line points: ${historyLines.length > 0 ? historyLines[0].length : 0}`);
        console.log(`[Server] - Text length: ${historyText.length}`);
        
        socket.emit('history', {
          lines: historyLines,
          text: historyText,
          roomId
        });
        
      } catch (err) {
        console.error('[Error] Request history event:', err.message);
        // Try to send empty but valid data as fallback
        try {
          const roomId = data.roomId || socket.currentRoom;
          if (roomId) {
            socket.emit('history', {
              lines: [],
              text: '',
              roomId
            });
          }
        } catch (recoveryErr) {
          console.error('[Error] Failed recovery attempt:', recoveryErr.message);
        }
      }
    });

    socket.on('undoRedo', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId || !data.lines || !Array.isArray(data.lines)) return;

        roomHistories[roomId] = data.lines;

        socket.to(roomId).emit('undoRedo', { roomId, lines: data.lines });
      } catch (err) {
        console.error('[Error] Undo/redo event:', err.message);
      }
    });
    
    // Handle cursor position updates
    socket.on('cursorPosition', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;
        
        // Initialize room cursors if it doesn't exist
        if (!roomCursors[roomId]) {
          roomCursors[roomId] = {};
        }
        
        // Store absolute canvas coordinates
        roomCursors[roomId][socket.id] = {
          x: data.canvasX,
          y: data.canvasY,
          userId: socket.id
        };
        
        // Broadcast to other clients
        socket.to(roomId).emit('cursorUpdate', {
          roomId,
          userId: socket.id,
          canvasX: data.canvasX,
          canvasY: data.canvasY
        });
      } catch (err) {
        console.error('[Error] Cursor position event:', err.message);
      }
    });

    // Handle user presence
    socket.on('userPresence', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        // Initialize room tracking structures if they don't exist
        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        if (!roomUserIds[roomId]) roomUserIds[roomId] = {};
        if (!roomNextUserNumber[roomId]) roomNextUserNumber[roomId] = 1;

        let userNumber;
        let isNewUser = false;

        // Check if this user already exists in this room
        if (roomUserIds[roomId][socket.id]) {
          // Existing user, use their assigned number
          userNumber = roomUserIds[roomId][socket.id];
          console.log(`[Server] Existing user ${socket.id} has number ${userNumber}`);
        } else {
          // New user, assign the next available number
          userNumber = roomNextUserNumber[roomId]++;
          roomUserIds[roomId][socket.id] = userNumber;
          isNewUser = true;
          console.log(`[Server] Assigned number ${userNumber} to new user ${socket.id}`);
        }

        // Create the user object with server-assigned number
        const serverUser = {
          id: socket.id,
          name: `User ${userNumber}`,
          color: data.user.color,
          number: userNumber // Add the user number to the object for reference
        };

        // Store as current user
        currentUser = serverUser;

        // Update or add the user in the room's user list
        const existingIndex = roomUsers[roomId].findIndex(u => u.id === socket.id);
        if (existingIndex >= 0) {
          roomUsers[roomId][existingIndex] = serverUser;
        } else {
          roomUsers[roomId].push(serverUser);
        }

        // Send the complete list of users to ALL clients in the room to ensure consistency
        io.to(roomId).emit('usersInRoom', {
          roomId,
          users: roomUsers[roomId]
        });

        // If this is a new user, also emit the userJoined event
        if (isNewUser) {
          socket.to(roomId).emit('userJoined', {
            roomId,
            user: serverUser
          });
        }

        console.log(`User in room ${roomId}: ${serverUser.name} (${socket.id})`);
        console.log(`Room ${roomId} now has ${roomUsers[roomId].length} users`);
      } catch (err) {
        console.error('[Error] User presence event:', err.message);
      }
    });

    socket.on('disconnect', () => {
      const roomId = socket.currentRoom;
      if (roomId) {
        // Remove user from the room's user list
        if (roomUsers[roomId] && currentUser) {
          // Filter out the disconnected user
          roomUsers[roomId] = roomUsers[roomId].filter(u => u.id !== socket.id);
          
        // Remove the user's cursor
        if (roomCursors[roomId]) {
          delete roomCursors[roomId][socket.id];
        }
        
        // We keep their user number assigned in roomUserIds in case they reconnect
        // We do NOT release user numbers to avoid confusion during reconnection
          
          // Notify others that a user left
          socket.to(roomId).emit('userLeft', {
            roomId,
            userId: socket.id
          });
          
          // Update all clients with the new user list
          socket.to(roomId).emit('usersInRoom', {
            roomId,
            users: roomUsers[roomId]
          });
          
          console.log(`User left room ${roomId}: ${currentUser.name} (${socket.id})`);
          console.log(`Room ${roomId} now has ${roomUsers[roomId].length} users`);
        }

        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (!roomSockets || roomSockets.size === 0) {
          activeRooms.delete(roomId);
          
          // If the room is completely empty, clean up room-specific data
          // But keep history and text for when users return
          delete roomUserIds[roomId];
          delete roomNextUserNumber[roomId];
        }
        console.log(`Client disconnected from room: ${roomId}, Socket ID: ${socket.id}`);
      }
    });
  });

  // Improved error handling
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
  
  // Add periodic state saving to handle server restarts
  // In a real production app, you would save this to a database instead
  let lastSaveTime = Date.now();
  const saveInterval = setInterval(() => {
    const now = Date.now();
    const saveOps = {
      rooms: Array.from(activeRooms),
      histories: Object.keys(roomHistories).length,
      texts: Object.keys(roomTexts).length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Server] State snapshot: ${JSON.stringify(saveOps)}`);
    lastSaveTime = now;
    
    // Here you would save to database:
    // await db.saveState({ roomHistories, roomTexts, roomTextVersions });
  }, 60000); // Save every minute
  
  // Clean up on shutdown
  process.on('SIGINT', () => {
    clearInterval(saveInterval);
    console.log('Server shutting down, saving state...');
    
    // Final save before shutdown
    // await db.saveState({ roomHistories, roomTexts, roomTextVersions });
    
    process.exit(0);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server running at http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
