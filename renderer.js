(function () {
    const CONFIG = window.CONFIG;

    class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.cellSize = 0;

            // Handle resizing
            window.addEventListener('resize', () => this.resize());
            // Defer initial resize slightly or call immediately
            // But safer to call via game init or here if DOM ready
            // Let's rely on caller or immediate:
            setTimeout(() => this.resize(), 0);
        }

        resize() {
            const wrap = this.canvas.parentElement;
            if (!wrap) return;

            const rect = wrap.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height);

            this.canvas.width = size * devicePixelRatio;
            this.canvas.height = size * devicePixelRatio;
            this.canvas.style.width = size + 'px';
            this.canvas.style.height = size + 'px';

            this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            this.cellSize = this.canvas.width / devicePixelRatio / CONFIG.cols;
        }

        draw(prevSnake, currSnake, food, interp) {
            // Safety check if not resized yet
            if (!this.cellSize) this.resize();

            const w = this.canvas.width / devicePixelRatio;
            const h = this.canvas.height / devicePixelRatio;

            // Clear
            this.ctx.clearRect(0, 0, w, h);

            // Draw Grid
            this.drawGrid(w, h);

            // Draw Food
            if (food) {
                this.drawCell(food.x, food.y, CONFIG.colors.food);
            }

            // Draw Snake (Interpolated)
            const renderListA = [...prevSnake];
            const renderListB = [...currSnake];

            while (renderListA.length < renderListB.length) renderListA.unshift(renderListA[0]);
            while (renderListB.length < renderListA.length) renderListB.unshift(renderListB[0]);

            for (let i = 0; i < renderListB.length; i++) {
                const p0 = renderListA[i];
                const p1 = renderListB[i];

                const ix = this.lerp(p0.x, p1.x, interp);
                const iy = this.lerp(p0.y, p1.y, interp);

                const isHead = (i === renderListB.length - 1);
                this.drawSmoothCell(ix, iy, isHead);
            }
        }

        lerp(a, b, t) {
            return a + (b - a) * t;
        }

        drawGrid(w, h) {
            this.ctx.strokeStyle = '#08323a';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();

            for (let i = 0; i <= CONFIG.cols; i++) {
                const x = i * this.cellSize + 0.5;
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, h);
            }
            for (let j = 0; j <= CONFIG.rows; j++) {
                const y = j * this.cellSize + 0.5;
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(w, y);
            }
            this.ctx.stroke();
        }

        drawCell(cx, cy, color) {
            const x = cx * this.cellSize;
            const y = cy * this.cellSize;
            const pad = Math.max(1, this.cellSize * 0.08);

            this.ctx.beginPath();
            this.ctx.rect(x + pad, y + pad, this.cellSize - 2 * pad, this.cellSize - 2 * pad);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        drawSmoothCell(px, py, isHead) {
            const x = px * this.cellSize;
            const y = py * this.cellSize;
            const r = Math.max(2, this.cellSize * 0.38);

            this.ctx.beginPath();
            this.ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, r, 0, Math.PI * 2);
            this.ctx.fillStyle = isHead ? CONFIG.colors.snakeHead : CONFIG.colors.snake;
            this.ctx.fill();
        }
    }

    window.Renderer = Renderer;
})();
