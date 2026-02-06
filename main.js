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



        // Input Mode Switching
        function setInputMode(mode) {
            document.body.classList.remove('input-mode-mouse', 'input-mode-touch', 'input-mode-gamepad');
            document.body.classList.add(`input-mode-${mode}`);
        }

        window.addEventListener('keydown', () => setInputMode('keyboard'));
        window.addEventListener('mousedown', () => setInputMode('mouse'));
        window.addEventListener('touchstart', () => setInputMode('touch'), { passive: true });

        // Gamepad Support
        let lastPausePress = 0;
        let lastButtonPress = 0;

        function pollGamepad() {
            if (!game) {
                requestAnimationFrame(pollGamepad);
                return;
            }

            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[0]; // Support first gamepad

            if (gp) {
                // Check for input activity to switch mode
                let inputActive = false;

                // Analog Stick (Axes)
                const axisX = gp.axes[0];
                const axisY = gp.axes[1];
                const threshold = 0.5;

                if (Math.abs(axisX) > threshold || Math.abs(axisY) > threshold) {
                    inputActive = true;
                    if (axisX < -threshold) game.setDirection(-1, 0); // Left
                    else if (axisX > threshold) game.setDirection(1, 0); // Right

                    if (axisY < -threshold) game.setDirection(0, -1); // Up
                    else if (axisY > threshold) game.setDirection(0, 1); // Down
                }

                // Buttons
                // D-Pad
                if (gp.buttons[12]?.pressed) { inputActive = true; game.setDirection(0, -1); }
                if (gp.buttons[13]?.pressed) { inputActive = true; game.setDirection(0, 1); }
                if (gp.buttons[14]?.pressed) { inputActive = true; game.setDirection(-1, 0); }
                if (gp.buttons[15]?.pressed) { inputActive = true; game.setDirection(1, 0); }

                // Actions
                // Button 0 (A), Button 1 (B), Button 2 (X), Button 3 (Y)
                // Button 9 (Start)

                const now = Date.now();
                if (gp.buttons.some(b => b.pressed)) inputActive = true;

                if (inputActive) setInputMode('gamepad');

                // Button Debounce logic for UI interactions
                if (now - lastButtonPress > 250) {
                    // Pause (Start)
                    if (gp.buttons[9]?.pressed) {
                        if (!startScreen.classList.contains('hidden') === false && !gameOverScreen.classList.contains('hidden') === false) {
                            game.pause();
                            pauseBtn.textContent = game.paused ? '继续' : '暂停'; // Note: innerHTML logic needed for icon+text if we had icons
                            lastButtonPress = now;
                        }
                    }

                    // A Button (0) - Confirm / Select
                    if (gp.buttons[0]?.pressed) {
                        if (!startScreen.classList.contains('hidden')) {
                            // Start Adventure
                            startGame('adventure');
                            lastButtonPress = now;
                        } else if (!gameOverScreen.classList.contains('hidden')) {
                            startGame(game.mode);
                            lastButtonPress = now;
                        } else if (!winScreen.classList.contains('hidden')) {
                            startGame('adventure');
                            lastButtonPress = now;
                        }
                    }

                    // X Button (2) - Alternative Mode
                    if (gp.buttons[2]?.pressed) {
                        if (!startScreen.classList.contains('hidden')) {
                            // Start Free Mode
                            startGame('free');
                            lastButtonPress = now;
                        }
                    }

                    // B Button (1) - Back / Cancel
                    if (gp.buttons[1]?.pressed) {
                        if (!gameScreen.classList.contains('hidden') && !game.paused && game.running) {
                            // In game -> Pause or Back? Let's just do Back logic which ends game
                            game.running = false;
                            goHome();
                            lastButtonPress = now;
                        } else if (!gameOverScreen.classList.contains('hidden') || !winScreen.classList.contains('hidden')) {
                            goHome();
                            lastButtonPress = now;
                        }
                    }
                }
            }
            requestAnimationFrame(pollGamepad);
        }
        requestAnimationFrame(pollGamepad);
    }

    // Boot
    init();
})();
