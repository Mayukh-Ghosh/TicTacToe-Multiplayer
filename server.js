// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Store game state for each room
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('joinRoom', (roomCode) => {
    const room = rooms[roomCode] || { players: [], board: Array(9).fill(null) };

    if (room.players.length < 2) {
      room.players.push(socket.id);
      rooms[roomCode] = room;
      socket.join(roomCode);
      socket.emit('loadGameState', room.board);

      // If the room is now full, let both players know who they are
      if (room.players.length === 2) {
        const playerX = room.players[0];
        const playerO = room.players[1];
        io.to(playerX).emit('playerAssignment', 'X');
        io.to(playerO).emit('playerAssignment', 'O');
        io.in(roomCode).emit('gameStart');
      }
    } else {
      socket.emit('roomFull');
    }
  });

  // Handle player move
  socket.on('makeMove', ({ index, player, roomCode }) => {
    const room = rooms[roomCode];
    if (room) {
      room.board[index] = player;
      io.in(roomCode).emit('updateBoard', { index, player });
    }
  });

  // Handle game reset
  socket.on('resetGame', (roomCode) => {
    if (rooms[roomCode]) {
      rooms[roomCode].board = Array(9).fill(null); // Reset the board
      io.in(roomCode).emit('resetBoard');
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Handle player leaving room or resetting game state if needed
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
