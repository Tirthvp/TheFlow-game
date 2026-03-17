const grid = document.getElementById("grid");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const gridSize = 6;
const startPos = { row: 0, col: 0 };
const tankPos = { row: 5, col: 5 };

let board = [];
let score = 0;
let moves = 0;
let timeLeft = 30;
let timer = null;
let gameActive = false;

const DIRS = {
  up: { dr: -1, dc: 0, opposite: "down" },
  right: { dr: 0, dc: 1, opposite: "left" },
  down: { dr: 1, dc: 0, opposite: "up" },
  left: { dr: 0, dc: -1, opposite: "right" }
};

const pipeTypes = {
  straight: [
    ["up", "down"],
    ["left", "right"]
  ],
  corner: [
    ["up", "right"],
    ["right", "down"],
    ["down", "left"],
    ["left", "up"]
  ]
};

function createBoard() {
  board = [];

  for (let row = 0; row < gridSize; row++) {
    const rowArray = [];

    for (let col = 0; col < gridSize; col++) {
      let tile;

      if (row === startPos.row && col === startPos.col) {
        tile = {
          kind: "source",
          connections: ["right"]
        };
      } else if (row === tankPos.row && col === tankPos.col) {
        tile = {
          kind: "tank",
          connections: ["left"]
        };
      } else {
        const isBad = Math.random() < 0.15;
        const type = Math.random() < 0.5 ? "straight" : "corner";
        const rotation = Math.floor(Math.random() * pipeTypes[type].length);

        tile = {
          kind: "pipe",
          type,
          rotation,
          isBad
        };
      }

      rowArray.push(tile);
    }

    board.push(rowArray);
  }

  renderBoard();
}

function getConnections(tile) {
  if (tile.kind === "source" || tile.kind === "tank") {
    return tile.connections;
  }

  return pipeTypes[tile.type][tile.rotation];
}

function renderBoard() {
  grid.innerHTML = "";

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tile = board[row][col];
      const tileEl = document.createElement("div");
      tileEl.classList.add("tile");
      tileEl.dataset.row = row;
      tileEl.dataset.col = col;

      if (tile.kind === "source") {
        tileEl.classList.add("source");
        tileEl.textContent = "🚰";
      } else if (tile.kind === "tank") {
        tileEl.classList.add("tank");
        tileEl.textContent = "🛢️";
      } else {
        if (tile.isBad) {
          tileEl.classList.add("bad");
        }

        drawPipe(tileEl, getConnections(tile));
        tileEl.addEventListener("click", () => rotateTile(row, col));
      }

      grid.appendChild(tileEl);
    }
  }
}

function drawPipe(tileEl, connections) {
  const center = document.createElement("div");
  center.classList.add("pipe-line", "pipe-center");
  tileEl.appendChild(center);

  connections.forEach((dir) => {
    const arm = document.createElement("div");
    arm.classList.add("pipe-line", `pipe-${dir}`);
    tileEl.appendChild(arm);
  });
}

function rotateTile(row, col) {
  if (!gameActive) return;

  const tile = board[row][col];
  if (tile.kind !== "pipe") return;

  tile.rotation = (tile.rotation + 1) % pipeTypes[tile.type].length;
  moves++;
  movesDisplay.textContent = moves;

  if (tile.isBad) {
    score -= 15;
    message.textContent = "Bad tile rotated. -15 points";
  } else {
    score += 10;
    message.textContent = "Pipe rotated. +10 points";
  }

  scoreDisplay.textContent = score;
  renderBoard();

  const connectedSet = findConnectedPath();
  highlightConnectedTiles(connectedSet);

  if (isWinningPath(connectedSet)) {
    clearInterval(timer);
    gameActive = false;
    score += 50 + timeLeft;
    scoreDisplay.textContent = score;
    message.textContent = "You connected the water supply!";
    launchConfetti();
  }
}

function startGame() {
  if (gameActive) return;

  gameActive = true;
  message.textContent = "Game started. Build the path!";
  startTimer();

  const connectedSet = findConnectedPath();
  highlightConnectedTiles(connectedSet);
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      gameActive = false;
      message.textContent = "Time's up! Try again.";
    }
  }, 1000);
}

function resetGame() {
  clearInterval(timer);
  score = 0;
  moves = 0;
  timeLeft = 30;
  gameActive = false;

  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = timeLeft;
  message.textContent = "Game reset.";

  createBoard();
}

function findConnectedPath() {
  const visited = new Set();
  const queue = [{ row: startPos.row, col: startPos.col }];

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.row}-${current.col}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const currentTile = board[current.row][current.col];
    const currentConnections = getConnections(currentTile);

    currentConnections.forEach((dir) => {
      const nextRow = current.row + DIRS[dir].dr;
      const nextCol = current.col + DIRS[dir].dc;

      if (
        nextRow < 0 ||
        nextRow >= gridSize ||
        nextCol < 0 ||
        nextCol >= gridSize
      ) {
        return;
      }

      const nextTile = board[nextRow][nextCol];
      const nextConnections = getConnections(nextTile);

      if (nextConnections.includes(DIRS[dir].opposite)) {
        queue.push({ row: nextRow, col: nextCol });
      }
    });
  }

  return visited;
}

function isWinningPath(connectedSet) {
  return connectedSet.has(`${tankPos.row}-${tankPos.col}`);
}

function highlightConnectedTiles(connectedSet) {
  const tileElements = document.querySelectorAll(".tile");

  tileElements.forEach((tileEl) => {
    const row = tileEl.dataset.row;
    const col = tileEl.dataset.col;

    if (row !== undefined && col !== undefined) {
      const key = `${row}-${col}`;
      if (connectedSet.has(key)) {
        tileEl.classList.add("connected");
      } else {
        tileEl.classList.remove("connected");
      }
    }
  });
}

function launchConfetti() {
  confetti({
    particleCount: 160,
    spread: 80,
    origin: { y: 0.6 }
  });
}

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

createBoard();