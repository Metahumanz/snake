(function () {
    const Renderer = window.Renderer;
    const SnakeGame = window.SnakeGame;
    const LEVELS = window.LEVELS;

    // DOM Elements
    const canvas = document.getElementById('gameCanvas');
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const levelInfoEl = document.getElementById('levelInfo');
    const pauseBtn = document.getElementById('pauseBtn');
    const backBtn = document.getElementById('backBtn');

    // Screens
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const winScreen = document.getElementById('winScreen');

    // Final Score Displays
    const finalScoreEl = document.getElementById('finalScore');
    const winScoreEl = document.getElementById('winScore');

    // Buttons
    const btnAdventure = document.getElementById('btnAdventure');
    const btnFree = document.getElementById('btnFree');
    const btnRestart = document.getElementById('btnRestart');
    const btnWinRestart = document.getElementById('btnWinRestart');
    const btnHomeOver = document.getElementById('btnHomeOver');
    const btnHomeWin = document.getElementById('btnHomeWin');

    let game;
    let bestScore = parseInt(localStorage.getItem('snake_best') || '0', 10);
    bestEl.textContent = bestScore;

    function init() {
        // Wait for Renderer class availability if script loading race occurs (unlikely with ordered tags)
        const renderer = new Renderer(canvas);

        game = new SnakeGame(
            renderer,
            (score) => {
                scoreEl.textContent = score;
                if (game.mode === 'adventure') {
                    const lvl = LEVELS[game.currentLevelIdx];
                    levelInfoEl.textContent = `Level ${lvl.level} - 目标: ${lvl.target}`;
                }
            },
            (level) => {
                // Level Up Feedback
                const lvl = LEVELS[game.currentLevelIdx];
                levelInfoEl.textContent = `Level ${lvl.level} - 目标: ${lvl.target}`;
                // Optional: Toast message "Level Up!"
                console.log('Level Up!', level);
            },
            (finalScore) => {
                handleGameOver(finalScore);
            },
            (finalScore) => {
                handleWin(finalScore);
            }
        );

        setupInputs();
    }

    function startGame(mode) {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
        winScreen.classList.add('hidden');

        if (mode === 'adventure') {
            levelInfoEl.classList.remove('hidden');
            const lvl = LEVELS[0];
            levelInfoEl.textContent = `Level ${lvl.level} - 目标: ${lvl.target}`;
        } else {
            levelInfoEl.classList.add('hidden');
        }

        game.init(mode);
        game.start();

        pauseBtn.textContent = '暂停';
        pauseBtn.disabled = false;
        scoreEl.textContent = '0';
    }

    function handleGameOver(score) {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snake_best', bestScore);
            bestEl.textContent = bestScore;
        }
        finalScoreEl.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function handleWin(score) {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snake_best', bestScore);
            bestEl.textContent = bestScore;
        }
        winScoreEl.textContent = score;
        winScreen.classList.remove('hidden');
    }

    function goHome() {
        game.running = false; // Ensure loop stops
        gameScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    function setupInputs() {
        // Mode Selection
        btnAdventure.addEventListener('click', () => startGame('adventure'));
        btnFree.addEventListener('click', () => startGame('free'));

        // Game Controls
        pauseBtn.addEventListener('click', () => {
            game.pause();
            pauseBtn.textContent = game.paused ? '继续' : '暂停';
        });

        backBtn.addEventListener('click', () => {
            game.running = false;
            goHome();
        });

        // Modal Buttons
        btnRestart.addEventListener('click', () => startGame(game.mode));
        btnWinRestart.addEventListener('click', () => startGame('adventure')); // Win usually implies adventure finished
        btnHomeOver.addEventListener('click', goHome);
        btnHomeWin.addEventListener('click', goHome);

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (startScreen.classList.contains('hidden')) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') game.setDirection(0, -1);
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') game.setDirection(0, 1);
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') game.setDirection(-1, 0);
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') game.setDirection(1, 0);
                if (e.key === ' ') {
                    game.pause();
                    pauseBtn.textContent = game.paused ? '继续' : '暂停';
                }
            }
        });

        // Touch Controls
        let touchStartX = 0;
        let touchStartY = 0;
        canvas.addEventListener('touchstart', (e) => {
            if (!game.running) return;
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            if (!game.running) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 20) game.setDirection(1, 0);
                else if (dx < -20) game.setDirection(-1, 0);
            } else {
                if (dy > 20) game.setDirection(0, 1);
                else if (dy < -20) game.setDirection(0, -1);
            }
        }, { passive: true });

        // Prevent scrolling
        document.body.addEventListener('touchmove', function (e) {
            if (e.target === canvas) e.preventDefault();
        }, { passive: false });
    }

    // Boot
    init();
})();
