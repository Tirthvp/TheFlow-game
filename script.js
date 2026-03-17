const grid = document.getElementById("grid");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

let score = 0;
let moves = 0;
let timeLeft = 30;
let timer;
let gameActive = false;

const gridSize = 6;
let tiles = [];

// Create Grid
function createGrid() {
    grid.innerHTML = "";
    tiles = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.rotation = 0;

        tile.addEventListener("click", () => rotateTile(tile));

        grid.appendChild(tile);
        tiles.push(tile);
    }
}

// Rotate Tile
function rotateTile(tile) {
    if (!gameActive) return;

    let rotation = parseInt(tile.dataset.rotation);
    rotation = (rotation + 90) % 360;
    tile.dataset.rotation = rotation;

    tile.style.transform = `rotate(${rotation}deg)`;

    moves++;
    movesDisplay.textContent = moves;

    score += 10;
    scoreDisplay.textContent = score;

    checkWin();
}

// Start Game
function startGame() {
    gameActive = true;
    message.textContent = "";
    startTimer();
}

// Timer
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
            message.textContent = "Time's up! You lost.";
        }
    }, 1000);
}

// Reset Game
function resetGame() {
    clearInterval(timer);
    score = 0;
    moves = 0;
    timeLeft = 30;
    gameActive = false;

    scoreDisplay.textContent = score;
    movesDisplay.textContent = moves;
    timerDisplay.textContent = timeLeft;
    message.textContent = "";

    createGrid();
}

// Win Condition (placeholder for now)
function checkWin() {
    // Temporary: win after 10 moves
    if (moves >= 10) {
        clearInterval(timer);
        gameActive = false;
        message.textContent = "You connected the water!";
    }
}

// Event Listeners
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

// Initialize
createGrid();