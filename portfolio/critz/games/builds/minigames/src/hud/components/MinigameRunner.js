const STORAGE_KEY = 'critz_runner_scores';
const MAX_LEADERBOARD_ENTRIES = 10;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class MinigameRunner {
  constructor() {
    this.root = null;
    this.canvas = null;
    this.context = null;
    this.overlay = null;
    this.scoreLabel = null;
    this.leaderboardList = null;
    this.nameInput = null;
    this.submitButton = null;
    this.restartButton = null;
    this.overlayTitle = null;
    this.overlayMessage = null;
    this.overlayInput = null;
    this.overlayPlay = null;
    this.running = false;
    this.gameOver = false;
    this.lastFrame = 0;
    this.distance = 0;
    this.speed = 480;
    this.nextSpawnDistance = 0;
    this.obstacles = [];
    this.player = null;
    this.keys = new Set();
    this.resizeObserver = null;
    this.boundFrame = (time) => this.frame(time);
    this.boundKeyDown = (event) => this.handleKeyDown(event);
    this.boundKeyUp = (event) => this.handleKeyUp(event);
  }

  mount(container) {
    if (!container) return;
    this.unmount();

    this.root = document.createElement('div');
    this.root.className = 'minigame-runner';
    this.root.innerHTML = `
      <div class="minigame-hud">
        <div class="minigame-score">Score: 0</div>
        <div class="minigame-controls">
          <button class="minigame-btn" data-action="restart">Restart</button>
        </div>
      </div>
      <div class="minigame-stage">
        <canvas class="minigame-canvas" aria-label="Runner game"></canvas>
        <div class="minigame-overlay">
          <div class="minigame-card">
            <h4 data-role="minigame-title">Game Over</h4>
            <p data-role="minigame-message">Type your name to save your run.</p>
            <div class="minigame-input" data-role="minigame-input">
              <input type="text" placeholder="Runner name" maxlength="16" />
              <button class="minigame-btn minigame-btn--accent" data-action="submit">Save</button>
            </div>
            <button class="minigame-btn minigame-btn--ghost" data-action="play-again" data-role="minigame-play">
              Play Again
            </button>
          </div>
        </div>
      </div>
      <aside class="minigame-leaderboard">
        <h5>Top Runners</h5>
        <ol class="minigame-leaderboard__list"></ol>
      </aside>
    `;

    container.innerHTML = '';
    container.appendChild(this.root);

    this.canvas = this.root.querySelector('.minigame-canvas');
    this.context = this.canvas.getContext('2d');
    this.overlay = this.root.querySelector('.minigame-overlay');
    this.scoreLabel = this.root.querySelector('.minigame-score');
    this.leaderboardList = this.root.querySelector('.minigame-leaderboard__list');
    this.nameInput = this.root.querySelector('input');
    this.submitButton = this.root.querySelector('[data-action="submit"]');
    this.restartButton = this.root.querySelector('[data-action="restart"]');
    const playAgainButton = this.root.querySelector('[data-action="play-again"]');
    this.overlayTitle = this.root.querySelector('[data-role="minigame-title"]');
    this.overlayMessage = this.root.querySelector('[data-role="minigame-message"]');
    this.overlayInput = this.root.querySelector('[data-role="minigame-input"]');
    this.overlayPlay = this.root.querySelector('[data-role="minigame-play"]');

    this.submitButton.addEventListener('click', () => this.saveScore());
    playAgainButton.addEventListener('click', () => this.restart());
    this.restartButton.addEventListener('click', () => this.restart());
    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.saveScore();
      }
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.root.querySelector('.minigame-stage'));
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    this.updateLeaderboard();
    this.start();
  }

  unmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    if (this.root) {
      this.root.remove();
    }
    this.root = null;
    this.canvas = null;
    this.context = null;
    this.overlay = null;
    this.scoreLabel = null;
    this.leaderboardList = null;
    this.nameInput = null;
    this.submitButton = null;
    this.restartButton = null;
    this.running = false;
    this.gameOver = false;
  }

  start() {
    this.running = true;
    this.gameOver = false;
    this.distance = 0;
    this.speed = 480;
    this.nextSpawnDistance = 240;
    this.obstacles = [];
    this.player = {
      width: 36,
      height: 48,
      duckHeight: 26,
      x: 80,
      y: 0,
      velocity: 0,
      isDucking: false,
    };
    this.player.isDucking = false;
    this.lastFrame = performance.now();
    this.hideOverlay();
    this.handleResize();
    requestAnimationFrame(this.boundFrame);
  }

  restart() {
    this.start();
  }

  handleResize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.player.y = rect.height - 80 - this.player.height;
  }

  frame(time) {
    if (!this.running) return;
    const delta = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    this.update(delta);
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  update(delta) {
    const gravity = 1800;
    const jumpVelocity = -620;
    const groundY = this.canvas.parentElement.getBoundingClientRect().height - 80;
    const playerHeight = this.player.isDucking ? this.player.duckHeight : this.player.height;

    this.player.isDucking = this.isDuckPressed();
    if (this.player.isDucking && !this.isOnGround(groundY, playerHeight)) {
      this.player.isDucking = false;
    }

    if (this.isJumpPressed() && this.isOnGround(groundY, playerHeight)) {
      this.player.velocity = jumpVelocity;
    }

    this.player.velocity += gravity * delta;
    this.player.y += this.player.velocity * delta;

    if (this.player.y + playerHeight > groundY) {
      this.player.y = groundY - playerHeight;
      this.player.velocity = 0;
    }

    this.distance += this.speed * delta;
    this.speed = clamp(this.speed + delta * 6, 480, 980);

    this.spawnObstacles(delta);
    this.updateObstacles(delta);
    this.checkCollisions(groundY);
    this.updateScore();
  }

  isOnGround(groundY, height) {
    return Math.abs(this.player.y + height - groundY) < 1;
  }

  isJumpPressed() {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  isDuckPressed() {
    return this.keys.has('ArrowDown') || this.keys.has('KeyS');
  }

  spawnObstacles() {
    const stageWidth = this.canvas.parentElement.getBoundingClientRect().width;
    if (this.distance < this.nextSpawnDistance) return;

    const progress = clamp(this.distance / 8000, 0, 1);
    const isOverhead = Math.random() < 0.2 + progress * 0.15;
    const size = 30 + Math.random() * 28;
    const obstacle = {
      x: stageWidth + 40,
      width: size,
      height: isOverhead ? size * 0.6 : size,
      type: isOverhead ? 'branch' : 'log',
      yOffset: isOverhead ? 110 + Math.random() * 40 : 0,
    };

    this.obstacles.push(obstacle);
    const minSpacing = 320 - progress * 120;
    const maxSpacing = 520 - progress * 200;
    const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
    this.nextSpawnDistance = this.distance + spacing;
  }

  updateObstacles(delta) {
    const velocity = this.speed * delta;
    this.obstacles.forEach((obstacle) => {
      obstacle.x -= velocity;
    });
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
  }

  checkCollisions(groundY) {
    const playerHeight = this.player.isDucking ? this.player.duckHeight : this.player.height;
    const playerBox = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: playerHeight,
    };

    for (const obstacle of this.obstacles) {
      const obstacleBox = {
        x: obstacle.x,
        y: obstacle.type === 'branch' ? groundY - obstacle.yOffset : groundY - obstacle.height,
        width: obstacle.width,
        height: obstacle.height,
      };

      if (this.intersects(playerBox, obstacleBox)) {
        this.endGame();
        break;
      }
    }
  }

  intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  draw() {
    if (!this.context) return;
    const ctx = this.context;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const groundY = height - 80;
    const playerHeight = this.player.isDucking ? this.player.duckHeight : this.player.height;

    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#74d0ff');
    sky.addColorStop(0.55, '#9ef28b');
    sky.addColorStop(1, '#39a36f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    const cloudOffset = (this.distance * 0.2) % (width + 200);
    ctx.arc(cloudOffset - 80, 80, 36, 0, Math.PI * 2);
    ctx.arc(cloudOffset + 20, 60, 26, 0, Math.PI * 2);
    ctx.arc(cloudOffset + 80, 90, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2b6e4d';
    ctx.fillRect(0, groundY, width, 80);

    ctx.fillStyle = '#1b3d2a';
    for (let i = 0; i < width; i += 120) {
      const treeX = i - (this.distance * 0.4) % 120;
      ctx.fillRect(treeX, groundY - 35, 20, 35);
      ctx.beginPath();
      ctx.arc(treeX + 10, groundY - 40, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffd166';
    ctx.fillRect(this.player.x, this.player.y, this.player.width, playerHeight);
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(this.player.x + 6, this.player.y + 8, this.player.width - 12, playerHeight - 16);

    this.obstacles.forEach((obstacle) => {
      if (obstacle.type === 'branch') {
        ctx.fillStyle = '#5c3b1e';
        ctx.fillRect(obstacle.x, groundY - obstacle.yOffset, obstacle.width, obstacle.height);
        ctx.fillStyle = '#2f7d44';
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, groundY - obstacle.yOffset - 10, 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#8d5524';
        ctx.fillRect(obstacle.x, groundY - obstacle.height, obstacle.width, obstacle.height);
        ctx.fillStyle = '#4d2600';
        ctx.fillRect(obstacle.x + 6, groundY - obstacle.height + 8, obstacle.width - 12, 6);
      }
    });
  }

  updateScore() {
    if (!this.scoreLabel) return;
    const score = Math.floor(this.distance / 10);
    this.scoreLabel.textContent = `Score: ${score}`;
  }

  endGame() {
    this.running = false;
    this.gameOver = true;
    this.showOverlay();
  }

  showOverlay() {
    if (this.overlay) {
      this.overlay.classList.add('is-active');
      this.overlay.classList.toggle('is-paused', !this.gameOver);
    }
    if (this.gameOver) {
      if (this.overlayTitle) this.overlayTitle.textContent = 'Game Over';
      if (this.overlayMessage) this.overlayMessage.textContent = 'Type your name to save your run.';
      if (this.overlayInput) this.overlayInput.style.display = 'flex';
      if (this.overlayPlay) this.overlayPlay.style.display = 'inline-flex';
      if (this.nameInput) {
        this.nameInput.value = '';
        this.nameInput.focus();
      }
    } else {
      if (this.overlayTitle) this.overlayTitle.textContent = 'Paused';
      if (this.overlayMessage) this.overlayMessage.textContent = 'Press P to resume the run.';
      if (this.overlayInput) this.overlayInput.style.display = 'none';
      if (this.overlayPlay) this.overlayPlay.style.display = 'none';
    }
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.classList.remove('is-active');
      this.overlay.classList.remove('is-paused');
    }
  }

  saveScore() {
    if (!this.gameOver) {
      return;
    }
    const name = (this.nameInput?.value || '').trim() || 'Anon';
    const score = Math.floor(this.distance / 10);
    const record = { name, score, date: Date.now() };
    const scores = this.loadScores();
    scores.push(record);
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    this.updateLeaderboard();
    this.hideOverlay();
  }

  loadScores() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  updateLeaderboard() {
    if (!this.leaderboardList) return;
    const scores = this.loadScores();
    this.leaderboardList.innerHTML = '';
    if (scores.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No runs yet. Be the first!';
      this.leaderboardList.appendChild(empty);
      return;
    }
    scores.forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.name} — ${entry.score}`;
      this.leaderboardList.appendChild(item);
    });
  }

  handleKeyDown(event) {
    if (this.gameOver && document.activeElement === this.nameInput) {
      return;
    }
    if (event.repeat) return;
    this.keys.add(event.code);

    if (event.code === 'KeyP') {
      if (this.running) {
        this.running = false;
        this.showOverlay();
      } else {
        this.running = true;
        this.hideOverlay();
        this.lastFrame = performance.now();
        requestAnimationFrame(this.boundFrame);
      }
    }

    if (event.code === 'KeyR') {
      this.restart();
    }

    if (this.player) {
      this.player.isDucking = this.isDuckPressed();
    }

    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    if (this.gameOver && document.activeElement === this.nameInput) {
      return;
    }
    this.keys.delete(event.code);
    if (this.player) {
      this.player.isDucking = this.isDuckPressed();
    }
  }
}
