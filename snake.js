const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");

const startBtn = document.getElementById("start");
const upBtn = document.getElementById("up");
const downBtn = document.getElementById("down");
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");

// 设置正方形画布
let canvasSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6);
canvasSize = canvasSize - (canvasSize % 20); // 保证能被格子整除
canvas.width = canvas.height = canvasSize;

const gridSize = 20;
let snake = [];
let snakeDir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = {};
let score = 0;
let highscore = 0;
let gameOver = false;
let animationFrameId;
let moveProgress = 0; 
const moveSpeed = 0.1;

function initGame() {
    snake = [{ x: Math.floor(canvas.width / (2 * gridSize)), y: Math.floor(canvas.height / (2 * gridSize)) }];
    snakeDir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    spawnFood();
    score = 0;
    gameOver = false;
    moveProgress = 0;
    scoreEl.textContent = score;
    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function drawGrid() {
    ctx.strokeStyle = "#eee";
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 
            ? getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim()
            : getComputedStyle(document.documentElement).getPropertyValue('--snake-body').trim();
        ctx.fillRect(
            snake[i].x * gridSize + moveProgress * snakeDir.x * gridSize,
            snake[i].y * gridSize + moveProgress * snakeDir.y * gridSize,
            gridSize,
            gridSize
        );
    }
}

function drawFood() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food').trim();
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize) {
        return true;
    }
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function updateSnake() {
    moveProgress += moveSpeed;
    if (moveProgress >= 1) {
        moveProgress = 0;
        snakeDir = nextDir;
        const newHead = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

        if (checkCollision(newHead)) {
            gameOver = true;
            alert("游戏结束！");
            if (score > highscore) highscore = score;
            highscoreEl.textContent = highscore;
            return;
        }

        snake.unshift(newHead);
        if (newHead.x === food.x && newHead.y === food.y) {
            score++;
            scoreEl.textContent = score;
            spawnFood();
        } else {
            snake.pop();
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();

    if (!gameOver) {
        updateSnake();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function changeDirection(dir) {
    if (gameOver) return;
    if (dir.x === -snakeDir.x && dir.y === -snakeDir.y) return;
    nextDir = dir;
}

// 键盘控制
window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp": changeDirection({ x: 0, y: -1 }); break;
        case "ArrowDown": changeDirection({ x: 0, y: 1 }); break;
        case "ArrowLeft": changeDirection({ x: -1, y: 0 }); break;
        case "ArrowRight": changeDirection({ x: 1, y: 0 }); break;
    }
});

// 移动端按钮控制
upBtn.addEventListener("click", () => changeDirection({ x: 0, y: -1 }));
downBtn.addEventListener("click", () => changeDirection({ x: 0, y: 1 }));
leftBtn.addEventListener("click", () => changeDirection({ x: -1, y: 0 }));
rightBtn.addEventListener("click", () => changeDirection({ x: 1, y: 0 }));

startBtn.addEventListener("click", initGame);
