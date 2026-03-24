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
let timeLeft = 40;
let timer = null;
let gameActive = false;
let currentDifficulty = "easy";
let milestonesHit = [];

const difficultySettings = {
  easy: {
    time: 40,
    badChance: 0.1,
    goodPoints: 12,
    badPenalty: 10,
    winBonus: 60,
    description: "Easy mode: more time and fewer bad tiles."
  },
  normal: {
    time: 30,
    badChance: 0.15,
    goodPoints: 10,
    badPenalty: 15,
    winBonus: 50,
    description: "Normal mode: balanced time and tile penalties."
  },
  hard: {
    time: 20,
    badChance: 0.22,
    goodPoints: 8,
    badPenalty: 20,
    winBonus: 40,
    description: "Hard mode: less time and more bad tiles."
  }
};

const milestoneList = [
  { score: 20, text: "Nice start! Clean water is on the way." },
  { score: 50, text: "Halfway there! Keep the flow moving." },
  { score: 80, text: "Great job! You are building real momentum." },
  { score: 120, text: "Amazing work! The system is almost complete." }
];

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

const sounds = {
  click: new Audio("assets/images/icons/sounds/click.mp3"),
  bad: new Audio("assets/images/icons/sounds/bad.mp3"),
  win: new Audio("assets/images/icons/sounds/win.mp3"),
  button: new Audio("assets/images/icons/sounds/button.mp3"),
  lose: new Audio("assets/images/icons/sounds/lose.mp3")
};

Object.values(sounds).forEach((sound) => {
  sound.volume = 0.5;
});

function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {
    // Browser may block autoplay until user interacts. Humanity loves browser policies.
  });
}

function createBoard() {
  board = [];
  const settings = difficultySettings[currentDifficulty];

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
        const isBad = Math.random() < settings.badChance;
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
  message.textContent = "Press Start to begin. Connect the water!";
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

function showTileFeedback(row, col, text, type) {
  const selector = `.tile[data-row="${row}"][data-col="${col}"]`;
  const tileEl = document.querySelector(selector);
  if (!tileEl) return;

  const popup = document.createElement("div");
  popup.classList.add("feedback-popup", type);
  popup.textContent = text;

  tileEl.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 800);
}

function rotateTile(row, col) {
  if (!gameActive) return;

  const tile = board[row][col];
  if (tile.kind !== "pipe") return;

  tile.rotation = (tile.rotation + 1) % pipeTypes[tile.type].length;
  moves++;
  movesDisplay.textContent = moves;

  const settings = difficultySettings[currentDifficulty];

  if (tile.isBad) {
    score -= settings.badPenalty;
    message.textContent = `Bad tile rotated. -${settings.badPenalty} points`;
    showTileFeedback(row, col, `-${settings.badPenalty}`, "bad-text");
    playSound("bad");
  } else {
    score += settings.goodPoints;
    message.textContent = `Pipe rotated. +${settings.goodPoints} points`;
    showTileFeedback(row, col, `+${settings.goodPoints}`, "good");
    playSound("click");
  }

  scoreDisplay.textContent = score;
  renderBoard();

  const connectedSet = findConnectedPath();
  highlightConnectedTiles(connectedSet);
  checkMilestones();

  if (isWinningPath(connectedSet)) {
    clearInterval(timer);
    gameActive = false;
    score += settings.winBonus + timeLeft;
    scoreDisplay.textContent = score;
    message.textContent = "You connected the water supply!";
    milestoneMessage.textContent = "Success! Clean water reached the tank.";
    launchConfetti();
    playSound("win");
  }
}

function startGame() {
  if (gameActive) return;

  playSound("button");
  gameActive = true;
  message.textContent = "Game started! Connect the pipes.";
  milestoneMessage.textContent = "Build the path before time runs out.";
  milestonesHit = [];
  score = 0;
  moves = 0;

  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;

  createBoard();
  message.textContent = "Game started! Connect the pipes.";
  startTimer();

  const connectedSet = findConnectedPath();
  highlightConnectedTiles(connectedSet);
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

  score = 0;
  moves = 0;
  timeLeft = difficultySettings[currentDifficulty].time;
  gameActive = false;
  milestonesHit = [];

  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = timeLeft;
  milestoneMessage.textContent = "Game reset. Choose your path again.";
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

function checkMilestones() {
  for (const milestone of milestoneList) {
    if (score >= milestone.score && !milestonesHit.includes(milestone.score)) {
      milestonesHit.push(milestone.score);
      milestoneMessage.textContent = milestone.text;
    }
  }
}

function launchConfetti() {
  confetti({
    particleCount: 180,
    spread: 85,
    origin: { y: 0.6 }
  });
}

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
  btn.addEventListener("click", () => {
    setDifficulty(btn.dataset.difficulty);
  });
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

timerDisplay.textContent = difficultySettings[currentDifficulty].time;
createBoard();