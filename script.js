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
let timer = null;
let gameActive = false;

const gridSize = 6;
let tiles = [];

// Create the game grid
function createGrid() {
    grid.innerHTML = "";
    tiles = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.textContent = "⬜";

        tile.dataset.rotation = 0;

        // 20% chance a tile becomes a bad tile
        const isBad = Math.random() < 0.2;
        tile.dataset.bad = isBad;

        if (isBad) {
            tile.classList.add("bad");
        }

        tile.addEventListener("click", () => rotateTile(tile));

        grid.appendChild(tile);
        tiles.push(tile);
    }
}

// Handle tile rotation and scoring
function rotateTile(tile) {
    if (!gameActive) return;

    let rotation = parseInt(tile.dataset.rotation);
    rotation = (rotation + 90) % 360;
    tile.dataset.rotation = rotation;
    tile.style.transform = `rotate(${rotation}deg)`;

    moves++;
    movesDisplay.textContent = moves;

    if (tile.dataset.bad === "true") {
        score -= 20;
        message.textContent = "Contaminated pipe! -20 points";
        tile.style.boxShadow = "0 0 12px rgba(255, 0, 0, 0.6)";
    } else {
        score += 10;
        message.textContent = "Pipe rotated! +10 points";
        tile.style.boxShadow = "0 0 12px rgba(0, 123, 255, 0.4)";
    }

    scoreDisplay.textContent = score;

    setTimeout(() => {
        tile.style.boxShadow = "none";
    }, 250);

    checkWin();
}

// Start the game
function startGame() {
    if (gameActive) return;

    gameActive = true;
    message.textContent = "Game started! Connect the flow.";
    startTimer();
}

// Start countdown timer
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

// Reset the game
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

    createGrid();
}

// Temporary prototype win condition
function checkWin() {
    if (moves >= 10) {
        clearInterval(timer);
        gameActive = false;
        message.textContent = "You connected the water!";

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

// Initialize game board on page load
createGrid();