const grid = document.getElementById("grid");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const message = document.getElementById("message");
const milestoneMessage = document.getElementById("milestoneMessage");
const difficultyDescription = document.getElementById("difficultyDescription");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const gridSize = 6;
const startPos = { row: 0, col: 0 };
const tankPos = { row: 5, col: 5 };

let board = [];
let score = 0;
let moves = 0;
let timeLeft = 45;
let timer = null;
let gameActive = false;
let currentDifficulty = "easy";
let milestonesHit = [];
let hasWon = false;

const difficultySettings = {
  easy: {
    time: 60,
    goodPoints: 10,
    winBonus: 80,
    description: "Easy mode: 60 seconds, simple L-shaped path."
  },
  normal: {
    time: 45,
    goodPoints: 10,
    winBonus: 55,
    description: "Normal mode: 45 seconds, longer winding path."
  },
  hard: {
    time: 30,
    goodPoints: 10,
    winBonus: 40,
    description: "Hard mode: 30 seconds, full snake path across every row."
  }
};

const milestoneList = [
  { score: 20,  text: "Nice start! Clean water is on the way."       },
  { score: 50,  text: "Halfway there! Keep the flow moving."          },
  { score: 80,  text: "Great job! You are building real momentum."    },
  { score: 120, text: "Amazing work! The system is almost complete."  }
];

const DIRS = {
  up:    { dr: -1, dc:  0, opposite: "down"  },
  right: { dr:  0, dc:  1, opposite: "left"  },
  down:  { dr:  1, dc:  0, opposite: "up"    },
  left:  { dr:  0, dc: -1, opposite: "right" }
};

const pipeTypes = {
  straight: [
    ["up", "down"],    // rotation 0
    ["left", "right"]  // rotation 1
  ],
  corner: [
    ["up", "right"],   // rotation 0
    ["right", "down"], // rotation 1
    ["down", "left"],  // rotation 2
    ["left", "up"]     // rotation 3
  ]
};

// ─── PRESET PATTERNS ──────────────────────────────────────────────────────────
// Each cell: { type, rotation } — the SOLVED rotation.
// createBoard() scrambles it so the player starts with a wrong orientation.
// Cells marked with type "source" or "tank" are handled separately.
//
// F = off-path filler tile (straight L-R), will also be scrambled.

const F = { type: "straight", rotation: 1 };

const presetPatterns = {

  // ── EASY ────────────────────────────────────────────────────────────────
  // Path: (0,0)→→→→→(0,5)↓↓↓↓↓(5,5)
  // A simple L: go right across row 0, then down col 5.
  easy: [
    [
      { type: "source"                    }, // (0,0)
      { type: "straight", rotation: 1    }, // (0,1) ←→
      { type: "straight", rotation: 1    }, // (0,2) ←→
      { type: "straight", rotation: 1    }, // (0,3) ←→
      { type: "straight", rotation: 1    }, // (0,4) ←→
      { type: "corner",   rotation: 1    }, // (0,5) →↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (1,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (2,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (3,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (4,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "tank"                     }, // (5,5)
    ],
  ],

  // ── NORMAL ──────────────────────────────────────────────────────────────
  // Path: (0,0)→(0,1)→(0,2)→(0,3)↓(1,3)↓(2,3)→(2,4)→(2,5)↓(3,5)↓(4,5)↓(5,5)
  // Two segments with a mid-board turn.
  normal: [
    [
      { type: "source"                    }, // (0,0)
      { type: "straight", rotation: 1    }, // (0,1) ←→
      { type: "straight", rotation: 1    }, // (0,2) ←→
      { type: "corner",   rotation: 1    }, // (0,3) →↓
      F,
      F,
    ],
    [
      F, F, F,
      { type: "straight", rotation: 0    }, // (1,3) ↑↓
      F,
      F,
    ],
    [
      F, F, F,
      { type: "corner",   rotation: 0    }, // (2,3) ↑→
      { type: "straight", rotation: 1    }, // (2,4) ←→
      { type: "corner",   rotation: 1    }, // (2,5) →↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (3,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "straight", rotation: 0    }, // (4,5) ↑↓
    ],
    [
      F, F, F, F, F,
      { type: "tank"                     }, // (5,5)
    ],
  ],

  // ── HARD ────────────────────────────────────────────────────────────────
  // Full snake: zigzags right→down→left→down→right→down→left→down→right→tank
  // Row 0: → → → → → ↓
  // Row 1: ↓ ← ← ← ← ↓  (turns at both ends)
  // Row 2: ↓ → → → → ↓
  // Row 3: ↓ ← ← ← ← ↓
  // Row 4: ↓ → → → → ↓
  // Row 5: (filler) ... tank
  hard: [
    [
      { type: "source"                    }, // (0,0)
      { type: "straight", rotation: 1    }, // (0,1) ←→
      { type: "straight", rotation: 1    }, // (0,2) ←→
      { type: "straight", rotation: 1    }, // (0,3) ←→
      { type: "straight", rotation: 1    }, // (0,4) ←→
      { type: "corner",   rotation: 1    }, // (0,5) →↓
    ],
    [
      { type: "corner",   rotation: 2    }, // (1,0) ↓←
      { type: "straight", rotation: 1    }, // (1,1) ←→
      { type: "straight", rotation: 1    }, // (1,2) ←→
      { type: "straight", rotation: 1    }, // (1,3) ←→
      { type: "straight", rotation: 1    }, // (1,4) ←→
      { type: "corner",   rotation: 2    }, // (1,5) ↓←
    ],
    [
      { type: "corner",   rotation: 1    }, // (2,0) →↓  (enters from above, exits right)
      { type: "straight", rotation: 1    }, // (2,1) ←→
      { type: "straight", rotation: 1    }, // (2,2) ←→
      { type: "straight", rotation: 1    }, // (2,3) ←→
      { type: "straight", rotation: 1    }, // (2,4) ←→
      { type: "corner",   rotation: 1    }, // (2,5) →↓
    ],
    [
      { type: "corner",   rotation: 2    }, // (3,0) ↓←
      { type: "straight", rotation: 1    }, // (3,1) ←→
      { type: "straight", rotation: 1    }, // (3,2) ←→
      { type: "straight", rotation: 1    }, // (3,3) ←→
      { type: "straight", rotation: 1    }, // (3,4) ←→
      { type: "corner",   rotation: 2    }, // (3,5) ↓←
    ],
    [
      { type: "corner",   rotation: 1    }, // (4,0) →↓
      { type: "straight", rotation: 1    }, // (4,1) ←→
      { type: "straight", rotation: 1    }, // (4,2) ←→
      { type: "straight", rotation: 1    }, // (4,3) ←→
      { type: "straight", rotation: 1    }, // (4,4) ←→
      { type: "corner",   rotation: 1    }, // (4,5) →↓
    ],
    [
      F, F, F, F, F,
      { type: "tank"                     }, // (5,5)
    ],
  ],
};

// ─── BOARD CREATION ───────────────────────────────────────────────────────────

function createBoard() {
  board = [];
  const pattern = presetPatterns[currentDifficulty];

  for (let row = 0; row < gridSize; row++) {
    const rowArray = [];

    for (let col = 0; col < gridSize; col++) {
      const cell = pattern[row][col];
      let tile;

      if (row === startPos.row && col === startPos.col) {
        tile = { kind: "source", connections: ["right"] };

      } else if (row === tankPos.row && col === tankPos.col) {
        tile = { kind: "tank", connections: ["left", "up", "right", "down"] };

      } else {
        const maxRot = pipeTypes[cell.type].length;
        // Start scrambled: guaranteed not the solved rotation
        let scrambled = (cell.rotation + 1 + Math.floor(Math.random() * (maxRot - 1))) % maxRot;

        tile = {
          kind: "pipe",
          type: cell.type,
          rotation: scrambled,
          solvedRotation: cell.rotation
        };
      }

      rowArray.push(tile);
    }

    board.push(rowArray);
  }

  renderBoard();
}

// ─── CONNECTIONS & RENDERING ──────────────────────────────────────────────────

function getConnections(tile) {
  if (tile.kind === "source" || tile.kind === "tank") return tile.connections;
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

// ─── TILE INTERACTION ─────────────────────────────────────────────────────────

function showTileFeedback(row, col, text, type) {
  const tileEl = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
  if (!tileEl) return;

  const popup = document.createElement("div");
  popup.classList.add("feedback-popup", type);
  popup.textContent = text;
  tileEl.appendChild(popup);

  setTimeout(() => popup.remove(), 800);
}

function rotateTile(row, col) {
  if (!gameActive || hasWon) return;

  const tile = board[row][col];
  if (tile.kind !== "pipe") return;

  tile.rotation = (tile.rotation + 1) % pipeTypes[tile.type].length;
  moves++;
  movesDisplay.textContent = moves;

  const { goodPoints } = difficultySettings[currentDifficulty];
  score += goodPoints;
  message.textContent = `Pipe rotated. +${goodPoints} points`;
  showTileFeedback(row, col, `+${goodPoints}`, "good");
  playSound("click");

  scoreDisplay.textContent = score;
  checkMilestones();
  renderBoard();
  checkForWin();
}

// ─── WIN LOGIC ────────────────────────────────────────────────────────────────

function handleWin() {
  if (hasWon) return;

  clearInterval(timer);
  timer = null;
  gameActive = false;
  hasWon = true;

  const { winBonus } = difficultySettings[currentDifficulty];
  score += winBonus + timeLeft;
  scoreDisplay.textContent = score;

  message.textContent = "You connected the water supply!";
  milestoneMessage.textContent = "Success! Clean water reached the tank.";

  const overlay = document.getElementById("winOverlay");
  const details = document.getElementById("winDetails");
  details.textContent = `Final score: ${score} pts — Completed in ${moves} moves with ${timeLeft}s to spare!`;
  overlay.classList.remove("hidden");

  launchConfetti();
  playSound("win");
}

// ─── GAME FLOW ────────────────────────────────────────────────────────────────

function startGame() {
  clearInterval(timer);
  playSound("button");
  document.getElementById("winOverlay").classList.add("hidden");

  score = 0;
  moves = 0;
  hasWon = false;
  milestonesHit = [];
  gameActive = true;

  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;

  createBoard();
  message.textContent = "Game started! Connect the pipes.";
  milestoneMessage.textContent = "Build the path before time runs out.";

  startTimer();
  highlightConnectedTiles(findConnectedPath());
}

function startTimer() {
  clearInterval(timer);
  timeLeft = difficultySettings[currentDifficulty].time;
  timerDisplay.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      timer = null;
      gameActive = false;
      message.textContent = "Time's up! Try again.";
      milestoneMessage.textContent = "You ran out of time. Reset and try again.";
      playSound("lose");
    }
  }, 1000);
}

function resetGame() {
  clearInterval(timer);
  playSound("button");
  document.getElementById("winOverlay").classList.add("hidden");

  score = 0;
  moves = 0;
  hasWon = false;
  milestonesHit = [];
  gameActive = true;
  timeLeft = difficultySettings[currentDifficulty].time;

  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = timeLeft;
  milestoneMessage.textContent = "New board loaded. Start building the path.";
  message.textContent = "Game reset.";

  createBoard();
  startTimer();
  highlightConnectedTiles(findConnectedPath());
}

// ─── PATH FINDING ─────────────────────────────────────────────────────────────

function canTilesConnect(row1, col1, row2, col2) {
  if (
    row1 < 0 || row1 >= gridSize || col1 < 0 || col1 >= gridSize ||
    row2 < 0 || row2 >= gridSize || col2 < 0 || col2 >= gridSize
  ) return false;

  const connections1 = getConnections(board[row1][col1]);
  const connections2 = getConnections(board[row2][col2]);

  for (const dir of connections1) {
    const nr = row1 + DIRS[dir].dr;
    const nc = col1 + DIRS[dir].dc;
    if (nr === row2 && nc === col2) {
      return connections2.includes(DIRS[dir].opposite);
    }
  }
  return false;
}

function findConnectedPath() {
  const visited = new Set();
  const queue = [{ row: startPos.row, col: startPos.col }];

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.row}-${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const connections = getConnections(board[current.row][current.col]);
    connections.forEach((dir) => {
      const nr = current.row + DIRS[dir].dr;
      const nc = current.col + DIRS[dir].dc;
      if (canTilesConnect(current.row, current.col, nr, nc)) {
        queue.push({ row: nr, col: nc });
      }
    });
  }

  return visited;
}

function hasWinningConnection(connectedSet) {
  const neighbors = [
    { row: tankPos.row,     col: tankPos.col - 1, requiredDir: "right" },
    { row: tankPos.row - 1, col: tankPos.col,     requiredDir: "down"  },
    { row: tankPos.row,     col: tankPos.col + 1, requiredDir: "left"  },
    { row: tankPos.row + 1, col: tankPos.col,     requiredDir: "up"    }
  ];

  for (const { row, col, requiredDir } of neighbors) {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) continue;
    if (!connectedSet.has(`${row}-${col}`)) continue;

    const tile = board[row][col];
    if (!tile || tile.kind === "source" || tile.kind === "tank") continue;
    if (getConnections(tile).includes(requiredDir)) return true;
  }

  return false;
}

function highlightConnectedTiles(connectedSet) {
  document.querySelectorAll(".tile").forEach((tileEl) => {
    const key = `${tileEl.dataset.row}-${tileEl.dataset.col}`;
    tileEl.classList.toggle("connected", connectedSet.has(key));
  });
}

function checkForWin() {
  const connectedSet = findConnectedPath();
  highlightConnectedTiles(connectedSet);
  if (hasWinningConnection(connectedSet)) handleWin();
}

// ─── MILESTONES & CONFETTI ────────────────────────────────────────────────────

function checkMilestones() {
  for (const milestone of milestoneList) {
    if (score >= milestone.score && !milestonesHit.includes(milestone.score)) {
      milestonesHit.push(milestone.score);
      milestoneMessage.textContent = milestone.text;
    }
  }
}

function launchConfetti() {
  confetti({ particleCount: 180, spread: 85, origin: { y: 0.6 } });
}

// ─── SOUNDS ───────────────────────────────────────────────────────────────────

const sounds = {
  click:  new Audio("assets/images/icons/sounds/click.mp3"),
  win:    new Audio("assets/images/icons/sounds/win.mp3"),
  button: new Audio("assets/images/icons/sounds/button.mp3"),
  lose:   new Audio("assets/images/icons/sounds/lose.mp3")
};

Object.values(sounds).forEach((s) => { s.volume = 0.5; });

function playSound(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// ─── DIFFICULTY ───────────────────────────────────────────────────────────────

function setDifficulty(level) {
  currentDifficulty = level;
  difficultyDescription.textContent = difficultySettings[level].description;
  timerDisplay.textContent = difficultySettings[level].time;

  difficultyButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === level);
  });

  resetGame();
}

difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.getElementById("winPlayAgain").addEventListener("click", () => {
  document.getElementById("winOverlay").classList.add("hidden");
  startGame();
});

startBtn.textContent = "New Game";
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

timerDisplay.textContent = difficultySettings[currentDifficulty].time;
startGame();