(function () {
    const CONFIG = window.CONFIG;
    const LEVELS = window.LEVELS;

    class SnakeGame {
        constructor(renderer, onScore, onLevelComplete, onGameOver, onWin) {
            this.renderer = renderer;
            this.onScore = onScore;
            this.onLevelComplete = onLevelComplete;
            this.onGameOver = onGameOver;
            this.onWin = onWin;

            this.snake = [];
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
            this.food = null;
            this.score = 0;
            this.mode = 'free'; // 'free' or 'adventure'
            this.currentLevelIdx = 0;

            this.running = false;
            this.paused = false;

            // Tick management
            this.lastTime = 0;
            this.tickAccum = 0;
            this.tickInterval = 1 / CONFIG.baseSpeed;

            // Interpolation state
            this.prevSnake = [];
        }

        init(mode = 'free') {
            this.mode = mode;
            this.currentLevelIdx = 0;
            this.score = 0;

            this.setLevel(0);
            this.resetSnake();
            this.placeFood();

            this.running = false;
            this.paused = false;
            this.lastTime = performance.now() / 1000;

            // Render initial state
            this.renderer.draw(this.snake, this.snake, this.food, 0);
        }

        setLevel(idx) {
            this.currentLevelIdx = idx;
            if (this.mode === 'adventure') {
                const lvl = LEVELS[this.currentLevelIdx];
                this.tickInterval = 1 / lvl.speed;
                console.log(`Level ${lvl.level}: Target ${lvl.target}, Speed ${lvl.speed}`);
            } else {
                this.tickInterval = 1 / CONFIG.baseSpeed;
            }
        }

        resetSnake() {
            const midX = Math.floor(CONFIG.cols / 2);
            const midY = Math.floor(CONFIG.rows / 2);
            this.snake = [{ x: midX - 1, y: midY }, { x: midX, y: midY }];
            this.prevSnake = JSON.parse(JSON.stringify(this.snake));
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
        }

        start() {
            if (!this.running) {
                this.running = true;
                this.lastTime = performance.now() / 1000;
                requestAnimationFrame((t) => this.loop(t));
            }
        }

        pause() {
            this.paused = !this.paused;
        }

        setDirection(dx, dy) {
            // Prevent reverse
            if (dx === -this.dir.x && dy === -this.dir.y && this.snake.length > 1) return;
            this.nextDir = { x: dx, y: dy };
        }

        loop(now) {
            if (!this.running) return;

            now = now / 1000;
            let dt = now - this.lastTime;
            if (dt > 0.25) dt = 0.25; // Cap dt for tab switching
            this.lastTime = now;

            if (!this.paused) {
                this.tickAccum += dt;
                while (this.tickAccum >= this.tickInterval) {
                    this.tick();
                    this.tickAccum -= this.tickInterval;
                }
            }

            const interp = Math.max(0, Math.min(1, this.tickAccum / this.tickInterval));
            this.renderer.draw(this.prevSnake, this.snake, this.food, interp);

            if (this.running) {
                requestAnimationFrame((t) => this.loop(t));
            }
        }

        tick() {
            // Update direction
            if (this.nextDir.x !== -this.dir.x || this.nextDir.y !== -this.dir.y || this.snake.length === 1) {
                this.dir = this.nextDir;
            }

            const head = this.snake[this.snake.length - 1];
            const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

            // Collision with walls
            if (newHead.x < 0 || newHead.x >= CONFIG.cols || newHead.y < 0 || newHead.y >= CONFIG.rows) {
                this.gameOver();
                return;
            }

            // Collision with self
            if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                this.gameOver();
                return;
            }

            // Move
            this.prevSnake = JSON.parse(JSON.stringify(this.snake));
            this.snake.push(newHead);

            // Eat food
            if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
                this.score++;
                this.placeFood();
                this.checkLevelProgress();
                this.onScore(this.score);
            } else {
                this.snake.shift();
            }
        }

        checkLevelProgress() {
            if (this.mode !== 'adventure') return;

            const currentLevel = LEVELS[this.currentLevelIdx];

            if (this.score >= currentLevel.target) {
                // Level Up or Win
                if (this.currentLevelIdx < LEVELS.length - 1) {
                    this.currentLevelIdx++;
                    this.setLevel(this.currentLevelIdx);
                    this.onLevelComplete(LEVELS[this.currentLevelIdx].level);
                } else {
                    this.win();
                }
            }
        }

        placeFood() {
            let tries = 0;
            while (tries++ < 1000) {
                const fx = Math.floor(Math.random() * CONFIG.cols);
                const fy = Math.floor(Math.random() * CONFIG.rows);
                if (!this.snake.some(s => s.x === fx && s.y === fy)) {
                    this.food = { x: fx, y: fy };
                    return;
                }
            }
            this.food = null;
        }

        gameOver() {
            this.running = false;
            this.onGameOver(this.score);
        }

        win() {
            this.running = false;
            this.onWin(this.score);
        }
    }

    window.SnakeGame = SnakeGame;
})();
