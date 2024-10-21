// script.js

const socket = io('tic-tac-toe-multiplayer-sepia.vercel.app');

let currentPlayer = ''; // Either 'X' or 'O', assigned by the server
let myTurn = false; // Players should take turns
let roomCode = '';  // The room code to join

const boardElement = document.getElementById('board');
const tiles = document.querySelectorAll('.tile');
const resetBtn = document.getElementById('reset-btn');
const roomSelection = document.getElementById('room-selection');
const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const roomCodeInput = document.getElementById('room-code-input');

// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase(); // 5-character random code
}

// Update the board UI with a player's move
function updateBoardUI(index, player) {
  const tile = document.querySelector(`[data-index="${index}"]`);
  if (!tile.textContent) {
    tile.textContent = player;
  }
}

// Handle a tile click (player's move)
function handleTileClick(e) {
  const index = e.target.dataset.index;

  if (myTurn && !e.target.textContent && roomCode) {
    updateBoardUI(index, currentPlayer);
    socket.emit('makeMove', { index, player: currentPlayer, roomCode });
    myTurn = false; // After making a move, it's no longer this player's turn
  }
}

// Add click event listeners to the tiles
tiles.forEach(tile => {
  tile.addEventListener('click', handleTileClick);
});

// Listen for updates from the server
socket.on('updateBoard', ({ index, player }) => {
  updateBoardUI(index, player);
  myTurn = player !== currentPlayer; // Switch turns after opponent moves
});

// Load game state on connection (if reconnecting)
socket.on('loadGameState', (gameState) => {
  gameState.forEach((player, index) => {
    if (player) {
      updateBoardUI(index, player);
    }
  });
});

// Assign player 'X' or 'O' when game starts
socket.on('playerAssignment', (player) => {
  currentPlayer = player;
  myTurn = player === 'X'; // Player 'X' goes first
});

// Handle game reset
resetBtn.addEventListener('click', () => {
  if (roomCode) {
    socket.emit('resetGame', roomCode);
  }
});

socket.on('resetBoard', () => {
  tiles.forEach(tile => {
    tile.textContent = ''; // Clear the board UI
  });
  myTurn = currentPlayer === 'X'; // Player 'X' starts after reset
});

// Handle room creation
createRoomBtn.addEventListener('click', () => {
  roomCode = generateRoomCode();
  socket.emit('joinRoom', roomCode);
  alert(`Room created! Share this code with your friend: ${roomCode}`);
  startGame();
});

// Handle joining an existing room
joinRoomBtn.addEventListener('click', () => {
  const enteredRoomCode = roomCodeInput.value.trim().toUpperCase();
  if (enteredRoomCode) {
    roomCode = enteredRoomCode;
    socket.emit('joinRoom', roomCode);
    startGame();
  }
});

// Start the game (hide room selection and show the game board)
function startGame() {
  roomSelection.style.display = 'none';
  boardElement.style.display = 'grid';
  resetBtn.style.display = 'inline-block';
}

// Handle room full case
socket.on('roomFull', () => {
  alert('This room is already full! Please join another room.');
});

// Theme toggle for light and dark mode
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});
