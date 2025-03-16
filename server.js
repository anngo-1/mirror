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

      // initialize room history if it doesn't exist
      if (!roomHistories[roomId]) {
        roomHistories[roomId] = [];
      }

      // initialize room text if it doesn't exist
      if (!roomTexts[roomId]) {
        roomTexts[roomId] = '';
      }

      // send the existing drawing history and text to the newly joined client
      socket.emit('history', {
        lines: roomHistories[roomId],
        text: roomTexts[roomId],
        roomId
      });
    });

    socket.on('drawing', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        if (data.line && Array.isArray(data.line)) {
          if (!roomHistories[roomId]) {
            roomHistories[roomId] = [];
          }

          // Store the drawing data (the line)
          roomHistories[roomId].push(data.line);

          socket.to(roomId).emit('drawing', data);
        }
      } catch (err) {
        console.error('[Error] Drawing event:', err.message);
      }
    });

    socket.on('eraseDrawing', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        if (data.lines && Array.isArray(data.lines)) {
          roomHistories[roomId] = data.lines;
          io.to(roomId).emit('history', { roomId, lines: data.lines });
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

    socket.on('textDelta', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        socket.to(roomId).emit('textDelta', {
          roomId,
          delta: data.delta,
          version: data.version
        });
      } catch (err) {
        console.error('[Error] Text delta event:', err.message);
      }
    });

    socket.on('textUpdate', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        roomTexts[roomId] = data.text;
      } catch (err) {
        console.error('[Error] Text update event:', err.message);
      }
    });

    socket.on('requestHistory', (data) => {
      try {
        const roomId = data.roomId || socket.currentRoom;
        if (!roomId) return;

        const historyText = roomTexts[roomId] || '';
        socket.emit('history', {
          lines: roomHistories[roomId] || [],
          text: historyText,
          roomId
        });
      } catch (err) {
        console.error('[Error] Request history event:', err.message);
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

    socket.on('disconnect', () => {
      const roomId = socket.currentRoom;
      if (roomId) {
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (!roomSockets || roomSockets.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server running at http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});