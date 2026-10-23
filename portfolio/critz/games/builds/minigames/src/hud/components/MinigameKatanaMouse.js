const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const sameDirection = (a, b) => a && b && a.x === b.x && a.y === b.y;
const STORAGE_KEY = 'critz_katana_mouse_leaderboard';
const MAX_LEADERBOARD = 8;
const SHOP_INTERVAL = 10;

export class MinigameKatanaMouse {
  constructor() {
    this.root = null;
    this.canvas = null;
    this.context = null;
    this.worldCanvas = document.createElement('canvas');
    this.worldContext = this.worldCanvas.getContext('2d');
    this.levelLabel = null;
    this.snakesLabel = null;
    this.goldLabel = null;
    this.restartButton = null;
    this.leaderboardList = null;
    this.shopOverlay = null;
    this.shopList = null;
    this.deathOverlay = null;
    this.deathInput = null;
    this.deathButton = null;
    this.countdownOverlay = null;
    this.countdownValue = null;
    this.pendingDeath = null;
    this.running = false;
    this.lastFrame = 0;
    this.keys = new Set();
    this.resizeObserver = null;
    this.world = { width: 240, height: 144, cell: 8 };
    this.grid = { cols: 30, rows: 18 };
    this.player = null;
    this.snakes = [];
    this.apples = [];
    this.coins = [];
    this.projectiles = [];
    this.slashProjectiles = [];
    this.lingeringSlashes = [];
    this.flames = [];
    this.level = 1;
    this.gold = 0;
    this.inShop = false;
    this.shopItems = [];
    this.startTime = 0;
    this.elapsedTime = 0;
    this.countdownTimer = 0;
    this.countdownNumber = 0;
    this.extraHearts = 0;
    this.upgrades = null;
    this.cheatHistory = { KeyL: [], KeyG: [], KeyK: [] };
    this.boundFrame = (time) => this.frame(time);
    this.boundKeyDown = (event) => this.handleKeyDown(event);
    this.boundKeyUp = (event) => this.handleKeyUp(event);
  }

  mount(container) {
    if (!container) return;
    this.unmount();

    this.root = document.createElement('div');
    this.root.className = 'minigame-katana';
    this.root.setAttribute('tabindex', '-1');
    this.root.innerHTML = `
      <div class="minigame-hud">
        <div class="minigame-katana__stats">
          <div class="minigame-score" data-role="level">Level 1</div>
          <div class="minigame-score" data-role="snakes">Snakes: 1</div>
          <div class="minigame-score" data-role="gold">Gold: 0</div>
        </div>
        <div class="minigame-controls">
          <button class="minigame-btn" data-action="restart">Restart</button>
        </div>
      </div>
      <div class="minigame-katana__layout">
        <div class="minigame-stage">
          <canvas class="minigame-canvas" aria-label="Katana mouse minigame"></canvas>
          <div class="minigame-katana__shop" data-role="shop">
            <div class="minigame-card minigame-katana__shop-card">
              <h4>Shop Time</h4>
              <p>Stand on a tile for 1 second to buy. Exit through the door.</p>
              <div class="minigame-katana__shop-list" data-role="shop-list"></div>
            </div>
          </div>
          <div class="minigame-katana__death" data-role="death">
            <div class="minigame-card">
              <h4>Game Over</h4>
              <p>Enter a name for the leaderboard.</p>
              <div class="minigame-input">
                <input type="text" placeholder="Mouse name" maxlength="16" data-role="death-input" />
                <button class="minigame-btn minigame-btn--accent" data-action="death-save">Save</button>
              </div>
            </div>
          </div>
          <div class="minigame-katana__countdown" data-role="countdown">
            <div class="minigame-card">
              <h4 data-role="countdown-value">3</h4>
              <p>Get ready!</p>
            </div>
          </div>
        </div>
        <aside class="minigame-katana__leaderboard">
          <h5>Top Survivors</h5>
          <ol class="minigame-leaderboard__list" data-role="leaderboard"></ol>
        </aside>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(this.root);

    this.canvas = this.root.querySelector('.minigame-canvas');
    this.context = this.canvas.getContext('2d');
    this.levelLabel = this.root.querySelector('[data-role="level"]');
    this.snakesLabel = this.root.querySelector('[data-role="snakes"]');
    this.goldLabel = this.root.querySelector('[data-role="gold"]');
    this.restartButton = this.root.querySelector('[data-action="restart"]');
    this.leaderboardList = this.root.querySelector('[data-role="leaderboard"]');
    this.shopOverlay = this.root.querySelector('[data-role="shop"]');
    this.shopList = this.root.querySelector('[data-role="shop-list"]');
    this.deathOverlay = this.root.querySelector('[data-role="death"]');
    this.deathInput = this.root.querySelector('[data-role="death-input"]');
    this.deathButton = this.root.querySelector('[data-action="death-save"]');
    this.countdownOverlay = this.root.querySelector('[data-role="countdown"]');
    this.countdownValue = this.root.querySelector('[data-role="countdown-value"]');

    this.restartButton.addEventListener('click', () => this.resetGame());
    this.deathButton.addEventListener('click', () => this.confirmDeath());
    this.deathInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.confirmDeath();
      }
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.root.querySelector('.minigame-stage'));
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    this.updateLeaderboard();
    this.start();
    this.root.focus();
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
    this.levelLabel = null;
    this.snakesLabel = null;
    this.goldLabel = null;
    this.restartButton = null;
    this.leaderboardList = null;
    this.shopOverlay = null;
    this.shopList = null;
    this.deathOverlay = null;
    this.deathInput = null;
    this.deathButton = null;
    this.countdownOverlay = null;
    this.countdownValue = null;
    this.running = false;
  }

  start() {
    this.resetGame();
    this.running = true;
    this.lastFrame = performance.now();
    this.handleResize();
    requestAnimationFrame(this.boundFrame);
  }

  frame(time) {
    if (!this.running) return;
    const delta = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    if (!this.inShop && !this.pendingDeath) {
      if (this.countdownTimer > 0) {
        this.updateCountdown(delta);
      } else {
        this.elapsedTime = (time - this.startTime) / 1000;
        this.update(delta);
      }
    }
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  handleResize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.worldCanvas.width = this.world.width;
    this.worldCanvas.height = this.world.height;
    this.worldContext.imageSmoothingEnabled = false;
  }

  resetGame() {
    this.level = 1;
    this.gold = 0;
    this.elapsedTime = 0;
    this.startTime = performance.now();
    this.inShop = false;
    this.pendingDeath = null;
    this.projectiles = [];
    this.slashProjectiles = [];
    this.lingeringSlashes = [];
    this.flames = [];
    this.shopItems = [];
    this.extraHearts = 0;
    this.upgrades = {
      speed: 0,
      size: 0,
      dash: false,
      dashBoost: 0,
      freeze: false,
      slashRadius: 0,
      flame: false,
      arcaneGun: false,
      shortCooldown: 0,
      lingering: false,
      slashProjectile: false,
      flameSword: false,
      greedy: false,
      extraHeart: false,
    };
    this.closeShop(true);
    this.hideDeathOverlay();
    this.resetLevel();
    this.startCountdown();
  }

  resetLevel() {
    const size = 8 + this.upgrades.size * 2;
    const centerX = this.world.width / 2;
    const centerY = this.world.height / 2;
    this.player = {
      x: centerX - size / 2,
      y: centerY - size / 2,
      width: size,
      height: size,
      speed: 84,
      facing: 'right',
      attackTimer: 0,
      attackCooldown: 0,
      attackDir: 'right',
      dashTimer: 0,
      dashCooldown: 0,
      freezeCooldown: 0,
      usingGun: false,
      gunCooldown: 0,
    };
    this.spawnSnakes(this.level);
    this.spawnApples(2 + Math.min(2, this.level));
    this.coins = [];
    this.projectiles = [];
    this.slashProjectiles = [];
    this.lingeringSlashes = [];
    this.flames = [];
    this.updateHud();
  }

  advanceLevel() {
    const nextLevel = this.level + 1;
    const shouldShop = nextLevel % SHOP_INTERVAL === 0;
    this.level = nextLevel;
    this.coins = [];
    if (shouldShop) {
      this.openShop();
      return;
    }
    this.resetLevel();
    this.startCountdown();
  }

  openShop() {
    this.inShop = true;
    this.snakes = [];
    this.apples = [];
    this.coins = [];
    this.projectiles = [];
    this.slashProjectiles = [];
    this.lingeringSlashes = [];
    this.flames = [];
    this.placePlayerCenter();
    this.shopItems = this.buildShopItems();
    if (this.shopOverlay) {
      this.shopOverlay.classList.add('is-active');
    }
    this.renderShop();
    this.updateHud();
    this.root?.focus();
  }

  closeShop(silent = false) {
    this.inShop = false;
    this.shopItems = [];
    if (this.shopOverlay) {
      this.shopOverlay.classList.remove('is-active');
    }
    if (!silent) {
      this.resetLevel();
      this.startCountdown();
    }
  }

  showDeathOverlay() {
    if (!this.deathOverlay) return;
    this.deathOverlay.classList.add('is-active');
    if (this.deathInput) {
      this.deathInput.value = '';
      this.deathInput.focus();
    }
  }

  hideDeathOverlay() {
    if (!this.deathOverlay) return;
    this.deathOverlay.classList.remove('is-active');
  }

  showCountdown() {
    if (!this.countdownOverlay) return;
    this.countdownOverlay.classList.add('is-active');
  }

  hideCountdown() {
    if (!this.countdownOverlay) return;
    this.countdownOverlay.classList.remove('is-active');
  }

  startCountdown() {
    this.countdownTimer = 3;
    this.countdownNumber = 3;
    if (this.countdownValue) {
      this.countdownValue.textContent = '3';
    }
    this.showCountdown();
  }

  updateCountdown(delta) {
    this.countdownTimer -= delta;
    const nextNumber = Math.max(0, Math.ceil(this.countdownTimer));
    if (nextNumber !== this.countdownNumber) {
      this.countdownNumber = nextNumber;
      if (this.countdownValue) {
        this.countdownValue.textContent = String(Math.max(1, nextNumber));
      }
    }
    if (this.countdownTimer <= 0) {
      this.countdownTimer = 0;
      this.hideCountdown();
    }
  }

  confirmDeath() {
    if (!this.pendingDeath) return;
    const name = (this.deathInput?.value || '').trim() || 'Anon';
    this.saveScore(name, this.pendingDeath.level, this.pendingDeath.time);
    this.pendingDeath = null;
    this.hideDeathOverlay();
    this.start();
  }

  renderShop() {
    if (!this.shopList) return;
    this.shopList.innerHTML = '';
    this.shopItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'minigame-katana__shop-row';

      const label = document.createElement('div');
      label.className = 'minigame-katana__shop-item';
      label.textContent = item.type === 'exit'
        ? 'Exit Door'
        : `${item.name} (${item.cost}g)`;

      const detail = document.createElement('div');
      detail.className = 'minigame-katana__shop-detail';
      detail.textContent = item.type === 'exit'
        ? 'Walk through to start the next level.'
        : item.description;

      row.appendChild(label);
      row.appendChild(detail);
      this.shopList.appendChild(row);
    });
  }

  buildShopItems() {
    const upgrades = this.getShopUpgrades();
    const availableUpgrades = upgrades.filter((upgrade) => upgrade.available);
    const pool = availableUpgrades.length >= 3 ? availableUpgrades : upgrades;
    const picks = [];
    while (picks.length < 3 && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }

    const positions = [
      { x: 6, y: 6 },
      { x: 22, y: 6 },
      { x: 14, y: 10 },
    ];
    const items = picks.map((upgrade, index) => {
      const pos = positions[index];
      return {
        id: upgrade.name,
        type: 'upgrade',
        name: upgrade.name,
        description: upgrade.description,
        cell: pos,
        cost: upgrade.cost,
        available: upgrade.available,
        hold: 0,
        apply: upgrade.apply,
      };
    });

    items.push({
      id: 'next-level',
      type: 'exit',
      cell: { x: 14, y: 16 },
      cost: 0,
      available: true,
      hold: 0,
      apply: () => this.closeShop(),
    });

    return items;
  }

  getShopUpgrades() {
    const upgrades = [];
    const speedRank = this.upgrades.speed;
    upgrades.push({
      name: speedRank < 3 ? `Speedy ${speedRank + 1}` : 'Speedy (Max)',
      cost: 3,
      available: speedRank < 3,
      description: 'Move much faster.',
      apply: () => {
        this.upgrades.speed += 1;
      },
    });

    upgrades.push({
      name: this.upgrades.shortCooldown >= 3 ? 'Sword Expert (Max)' : 'Sword Expert',
      cost: 3,
      available: this.upgrades.shortCooldown < 3,
      description: 'Lower sword cooldown.',
      apply: () => {
        this.upgrades.shortCooldown += 1;
      },
    });

    upgrades.push({
      name: this.upgrades.slashProjectile ? 'Air Slash (Unlocked)' : 'Air Slash',
      cost: 3,
      available: !this.upgrades.slashProjectile,
      description: 'Send a blade wave forward.',
      apply: () => {
        this.upgrades.slashProjectile = true;
      },
    });

    upgrades.push({
      name: this.upgrades.flameSword ? 'Flame Sword (Unlocked)' : 'Flame Sword',
      cost: 3,
      available: !this.upgrades.flameSword,
      description: 'Leave burning flames after slashing.',
      apply: () => {
        this.upgrades.flameSword = true;
      },
    });

    upgrades.push({
      name: this.upgrades.greedy ? 'Greedy (Unlocked)' : 'Greedy',
      cost: 3,
      available: !this.upgrades.greedy,
      description: 'Extra gold drops from kills.',
      apply: () => {
        this.upgrades.greedy = true;
      },
    });

    upgrades.push({
      name: this.upgrades.extraHeart ? 'Extra Heart (Used)' : 'Extra Heart',
      cost: 3,
      available: !this.upgrades.extraHeart,
      description: 'Revive once after dying.',
      apply: () => {
        this.upgrades.extraHeart = true;
        this.extraHearts = Math.min(1, this.extraHearts + 1);
      },
    });

    return upgrades;
  }

  spawnSnakes(count) {
    this.snakes = [];
    for (let i = 0; i < count; i += 1) {
      const head = this.findEdgeCell();
      const body = head.x > 0 ? { x: head.x - 1, y: head.y } : { x: head.x + 1, y: head.y };
      const direction = head.x > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      const snake = {
        segments: [head, body],
        direction,
        moveTimer: 0,
        moveInterval: Math.max(0.12, 0.22 - this.level * 0.01),
        grow: 0,
        alive: true,
        hitTimer: 0,
        freezeTimer: 0,
      };
      this.snakes.push(snake);
    }
  }

  spawnApples(count) {
    this.apples = [];
    for (let i = 0; i < count; i += 1) {
      this.apples.push(this.findFreeCell());
    }
  }

  findEdgeCell() {
    let attempts = 0;
    const playerCell = this.getPlayerCell();
    while (attempts < 80) {
      const edge = Math.floor(Math.random() * 4);
      let cell;
      if (edge === 0) {
        cell = { x: 0, y: Math.floor(Math.random() * this.grid.rows) };
      } else if (edge === 1) {
        cell = { x: this.grid.cols - 1, y: Math.floor(Math.random() * this.grid.rows) };
      } else if (edge === 2) {
        cell = { x: Math.floor(Math.random() * this.grid.cols), y: 0 };
      } else {
        cell = { x: Math.floor(Math.random() * this.grid.cols), y: this.grid.rows - 1 };
      }
      const distance = Math.abs(cell.x - playerCell.x) + Math.abs(cell.y - playerCell.y);
      if (distance > 6 && this.isCellFree(cell)) {
        return cell;
      }
      attempts += 1;
    }
    return { x: 0, y: 0 };
  }

  findFreeCell() {
    let attempts = 0;
    while (attempts < 80) {
      const cell = {
        x: Math.floor(Math.random() * this.grid.cols),
        y: Math.floor(Math.random() * this.grid.rows),
      };
      if (this.isCellFree(cell)) return cell;
      attempts += 1;
    }
    return { x: 1, y: 1 };
  }

  isCellFree(cell) {
    const playerCell = this.getPlayerCell();
    if (cell.x === playerCell.x && cell.y === playerCell.y) return false;
    for (const snake of this.snakes) {
      for (const segment of snake.segments) {
        if (segment.x === cell.x && segment.y === cell.y) return false;
      }
    }
    for (const apple of this.apples) {
      if (apple.x === cell.x && apple.y === cell.y) return false;
    }
    return true;
  }

  update(delta) {
    if (!this.player) return;
    if (this.inShop) {
      this.updatePlayer(delta);
      this.checkShopPickup(delta);
      return;
    }
    this.updatePlayer(delta);
    this.updateSnakes(delta);
    this.updateProjectiles(delta);
    this.updateLingeringSlashes(delta);
    this.updateFlames(delta);
    this.checkPlayerHit();
    this.checkSlashHits();
    this.checkApplePickup();
    this.checkCoinPickup();
    this.cleanupSnakes();
  }

  updateFlames(delta) {
    if (this.flames.length === 0) return;
    this.flames.forEach((flame) => {
      flame.life -= delta;
    });
    this.flames = this.flames.filter((flame) => flame.life > 0);
    if (this.flames.length === 0) return;
    this.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const headBox = this.cellToBox(snake.segments[0]);
      if (this.flames.some((flame) => this.intersects(flame, headBox))) {
        snake.alive = false;
        this.spawnCoinFromCell(snake.segments[0], this.upgrades.greedy ? 3 : 2);
        return;
      }
      for (let i = 1; i < snake.segments.length; i += 1) {
        const segmentBox = this.cellToBox(snake.segments[i]);
        if (this.flames.some((flame) => this.intersects(flame, segmentBox))) {
          snake.segments = snake.segments.slice(0, i);
          snake.hitTimer = 0.2;
          this.spawnCoinFromCell(
            snake.segments[i - 1] || snake.segments[0],
            this.upgrades.greedy ? 2 : 1
          );
          return;
        }
      }
    });
  }

  updateLingeringSlashes(delta) {
    if (this.lingeringSlashes.length === 0) return;
    this.lingeringSlashes.forEach((slash) => {
      slash.life -= delta;
    });
    this.lingeringSlashes = this.lingeringSlashes.filter((slash) => slash.life > 0);
    if (this.lingeringSlashes.length === 0) return;
    this.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const headCenter = this.cellCenter(snake.segments[0]);
      for (const slash of this.lingeringSlashes) {
        if (this.isPointInSlash(headCenter, slash)) {
          snake.alive = false;
          this.spawnCoinFromCell(snake.segments[0], this.upgrades.greedy ? 3 : 2);
          return;
        }
      }
      for (let i = 1; i < snake.segments.length; i += 1) {
        const center = this.cellCenter(snake.segments[i]);
        for (const slash of this.lingeringSlashes) {
          if (this.isPointInSlash(center, slash)) {
            snake.segments = snake.segments.slice(0, i);
            snake.hitTimer = 0.2;
            this.spawnCoinFromCell(
              snake.segments[i - 1] || snake.segments[0],
              this.upgrades.greedy ? 2 : 1
            );
            return;
          }
        }
      }
    });
  }

  updatePlayer(delta) {
    const move = this.getMoveVector();
    const speedBoost = 1 + this.upgrades.speed * 0.15;
    const dashBoost = this.upgrades.dashBoost * 0.35;
    const dashSpeedMultiplier = this.player.dashTimer > 0 ? 1.8 + dashBoost : 1;
    const speed = this.player.speed * speedBoost * dashSpeedMultiplier;

    this.player.x += move.x * speed * delta;
    this.player.y += move.y * speed * delta;
    this.player.x = clamp(this.player.x, 0, this.world.width - this.player.width);
    this.player.y = clamp(this.player.y, 0, this.world.height - this.player.height);

    if (move.x !== 0 || move.y !== 0) {
      if (Math.abs(move.x) >= Math.abs(move.y)) {
        this.player.facing = move.x > 0 ? 'right' : 'left';
      } else {
        this.player.facing = move.y > 0 ? 'down' : 'up';
      }
    }

    if (this.player.attackTimer > 0) {
      this.player.attackTimer = Math.max(0, this.player.attackTimer - delta);
    }
    if (this.player.attackCooldown > 0) {
      this.player.attackCooldown = Math.max(0, this.player.attackCooldown - delta);
    }
    if (this.player.dashTimer > 0) {
      this.player.dashTimer = Math.max(0, this.player.dashTimer - delta);
    }
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - delta);
    }
    if (this.player.freezeCooldown > 0) {
      this.player.freezeCooldown = Math.max(0, this.player.freezeCooldown - delta);
    }
    if (this.player.gunCooldown > 0) {
      this.player.gunCooldown = Math.max(0, this.player.gunCooldown - delta);
    }
  }

  updateSnakes(delta) {
    const playerCell = this.getPlayerCell();
    this.snakes.forEach((snake) => {
      if (!snake.alive) return;
      if (snake.freezeTimer > 0) {
        snake.freezeTimer = Math.max(0, snake.freezeTimer - delta);
        return;
      }
      snake.moveTimer += delta;
      if (snake.hitTimer > 0) {
        snake.hitTimer = Math.max(0, snake.hitTimer - delta);
      }
      if (snake.moveTimer < snake.moveInterval) return;
      snake.moveTimer = 0;

      const target = this.pickSnakeTarget(snake, playerCell);
      const nextDirection = this.chooseSnakeDirection(snake, target);
      if (nextDirection) {
        snake.direction = nextDirection;
      }

      const head = snake.segments[0];
      const next = { x: head.x + snake.direction.x, y: head.y + snake.direction.y };
      if (!this.isInsideGrid(next) || this.isCellBlockedBySnakes(snake, next, snake.grow === 0)) {
        return;
      }

      snake.segments.unshift(next);
      if (snake.grow > 0) {
        snake.grow -= 1;
      } else {
        snake.segments.pop();
      }

      const appleIndex = this.apples.findIndex((apple) => apple.x === next.x && apple.y === next.y);
      if (appleIndex >= 0) {
        snake.grow += 1;
        this.apples[appleIndex] = this.findFreeCell();
      }
    });
  }

  updateProjectiles(delta) {
    if (this.projectiles.length === 0 && this.slashProjectiles.length === 0) return;
    const speed = 220;
    this.projectiles.forEach((projectile) => {
      projectile.x += projectile.vx * speed * delta;
      projectile.y += projectile.vy * speed * delta;
      projectile.life -= delta;
    });
    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

    const slashSpeed = 180;
    this.slashProjectiles.forEach((projectile) => {
      projectile.x += projectile.vx * slashSpeed * delta;
      projectile.y += projectile.vy * slashSpeed * delta;
      projectile.life -= delta;
    });
    this.slashProjectiles = this.slashProjectiles.filter((projectile) => projectile.life > 0);

    this.projectiles.forEach((projectile) => {
      this.snakes.forEach((snake) => {
        if (!snake.alive) return;
        const headBox = this.cellToBox(snake.segments[0]);
        if (this.intersects(projectile, headBox)) {
          snake.alive = false;
          this.spawnCoinFromCell(snake.segments[0], this.upgrades.greedy ? 3 : 2);
          projectile.life = 0;
          return;
        }
        for (let i = 1; i < snake.segments.length; i += 1) {
          const segmentBox = this.cellToBox(snake.segments[i]);
          if (this.intersects(projectile, segmentBox)) {
            snake.segments = snake.segments.slice(0, i);
            snake.hitTimer = 0.2;
            this.spawnCoinFromCell(
              snake.segments[i - 1] || snake.segments[0],
              this.upgrades.greedy ? 2 : 1
            );
            projectile.life = 0;
            break;
          }
        }
      });
    });

    this.slashProjectiles.forEach((projectile) => {
      this.snakes.forEach((snake) => {
        if (!snake.alive) return;
        const headCenter = this.cellCenter(snake.segments[0]);
        if (this.intersects(projectile, {
          x: headCenter.x - 3,
          y: headCenter.y - 3,
          width: 6,
          height: 6,
        })) {
          snake.alive = false;
          this.spawnCoinFromCell(snake.segments[0], this.upgrades.flame ? 3 : 2);
          projectile.life = 0;
          return;
        }
        for (let i = 1; i < snake.segments.length; i += 1) {
          const center = this.cellCenter(snake.segments[i]);
          if (this.intersects(projectile, {
            x: center.x - 3,
            y: center.y - 3,
            width: 6,
            height: 6,
          })) {
            snake.segments = snake.segments.slice(0, i);
            snake.hitTimer = 0.2;
            this.spawnCoinFromCell(
              snake.segments[i - 1] || snake.segments[0],
              this.upgrades.flame ? 2 : 1
            );
            projectile.life = 0;
            break;
          }
        }
      });
    });
  }

  pickSnakeTarget(snake, playerCell) {
    const chaseRadius = 6;
    const head = snake.segments[0];
    const distanceToMouse = Math.abs(head.x - playerCell.x) + Math.abs(head.y - playerCell.y);
    if (distanceToMouse <= chaseRadius) {
      return playerCell;
    }
    if (this.apples.length === 0) return playerCell;
    let closest = this.apples[0];
    let best = Number.MAX_SAFE_INTEGER;
    this.apples.forEach((apple) => {
      const score = Math.abs(apple.x - head.x) + Math.abs(apple.y - head.y);
      if (score < best) {
        best = score;
        closest = apple;
      }
    });
    return closest;
  }

  chooseSnakeDirection(snake, target) {
    const head = snake.segments[0];
    const desired = [];
    const dx = target.x - head.x;
    const dy = target.y - head.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) desired.push({ x: Math.sign(dx), y: 0 });
      if (dy !== 0) desired.push({ x: 0, y: Math.sign(dy) });
    } else {
      if (dy !== 0) desired.push({ x: 0, y: Math.sign(dy) });
      if (dx !== 0) desired.push({ x: Math.sign(dx), y: 0 });
    }

    const back = { x: -snake.direction.x, y: -snake.direction.y };

    const options = [...desired, ...DIRECTIONS];
    for (const option of options) {
      if (sameDirection(option, back)) continue;
      const next = { x: head.x + option.x, y: head.y + option.y };
      if (!this.isInsideGrid(next)) continue;
      if (this.isCellBlockedBySnakes(snake, next, snake.grow === 0)) continue;
      return option;
    }
    return null;
  }

  isInsideGrid(cell) {
    return cell.x >= 0 && cell.x < this.grid.cols && cell.y >= 0 && cell.y < this.grid.rows;
  }

  isCellBlockedBySnakes(activeSnake, cell, allowTail) {
    for (const snake of this.snakes) {
      const length = snake.segments.length;
      for (let i = 0; i < length; i += 1) {
        if (snake === activeSnake && allowTail && i === length - 1) continue;
        const segment = snake.segments[i];
        if (segment.x === cell.x && segment.y === cell.y) return true;
      }
    }
    return false;
  }

  checkPlayerHit() {
    const playerBox = this.getPlayerBox();
    for (const snake of this.snakes) {
      if (!snake.alive) continue;
      for (const segment of snake.segments) {
        const segmentBox = this.cellToBox(segment);
        if (this.intersects(playerBox, segmentBox)) {
          this.handleDeath();
          return;
        }
      }
    }
  }

  checkSlashHits() {
    if (!this.isSlashActive()) return;
    const slash = this.getSlashArc();
    if (!slash) return;
    this.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const headCenter = this.cellCenter(snake.segments[0]);
      if (this.isPointInSlash(headCenter, slash)) {
        snake.alive = false;
        this.spawnCoinFromCell(snake.segments[0], this.upgrades.greedy ? 3 : 2);
        return;
      }
      for (let i = 1; i < snake.segments.length; i += 1) {
        const center = this.cellCenter(snake.segments[i]);
        if (this.isPointInSlash(center, slash)) {
          snake.segments = snake.segments.slice(0, i);
          snake.hitTimer = 0.2;
          this.spawnCoinFromCell(
            snake.segments[i - 1] || snake.segments[0],
            this.upgrades.greedy ? 2 : 1
          );
          break;
        }
      }
    });

    if (this.upgrades.lingering) {
      this.lingeringSlashes.push({
        ...slash,
        life: 0.35,
      });
    }
  }

  checkCoinPickup() {
    if (this.coins.length === 0) return;
    const playerBox = this.getPlayerBox();
    this.coins = this.coins.filter((coin) => {
      if (this.intersects(playerBox, coin)) {
        this.gold += 1;
        this.updateHud();
        return false;
      }
      return true;
    });
  }

  checkApplePickup() {
    if (this.apples.length === 0) return;
    const playerBox = this.getPlayerBox();
    this.apples = this.apples.map((apple) => {
      const appleBox = this.cellToBox(apple);
      if (this.intersects(playerBox, appleBox)) {
        return this.findFreeCell();
      }
      return apple;
    });
  }

  checkShopPickup(delta) {
    if (!this.shopItems.length) return;
    const playerBox = this.getPlayerBox();
    this.shopItems.forEach((item) => {
      const box = this.cellToBox(item.cell);
      if (this.intersects(playerBox, box)) {
        item.hold = Math.min(1, (item.hold || 0) + delta);
        if (item.hold >= 1) {
          if (item.type === 'exit') {
            item.apply();
            return;
          }
          if (!item.available || this.gold < item.cost) {
            item.hold = 0;
            return;
          }
          this.gold -= item.cost;
          item.apply();
          item.available = false;
          item.hold = 0;
          this.updateHud();
          this.renderShop();
        }
      } else {
        item.hold = 0;
      }
    });
  }

  cleanupSnakes() {
    this.snakes = this.snakes.filter((snake) => snake.alive);
    if (this.snakes.length === 0) {
      this.advanceLevel();
    } else {
      this.updateHud();
    }
  }

  handleDeath() {
    if (this.pendingDeath) return;
    if (this.extraHearts > 0) {
      this.extraHearts -= 1;
      this.upgrades.extraHeart = false;
      this.resetLevel();
      this.startCountdown();
      return;
    }
    this.pendingDeath = { level: this.level, time: Math.floor(this.elapsedTime) };
    this.showDeathOverlay();
  }

  saveScore(name, level, time) {
    const record = { name, level, time, date: Date.now() };
    const scores = this.loadScores();
    scores.push(record);
    scores.sort((a, b) => {
      if (a.level !== b.level) return b.level - a.level;
      return b.time - a.time;
    });
    const trimmed = scores.slice(0, MAX_LEADERBOARD);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    this.updateLeaderboard();
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
      const name = entry.name || 'Anon';
      item.textContent = `${name} — L${entry.level} — ${this.formatTime(entry.time)}`;
      this.leaderboardList.appendChild(item);
    });
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getMoveVector() {
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const up = this.keys.has('ArrowUp') || this.keys.has('KeyW');
    const down = this.keys.has('ArrowDown') || this.keys.has('KeyS');
    let x = (right ? 1 : 0) - (left ? 1 : 0);
    let y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  getPlayerCell() {
    return {
      x: clamp(Math.floor((this.player.x + this.player.width / 2) / this.world.cell), 0, this.grid.cols - 1),
      y: clamp(Math.floor((this.player.y + this.player.height / 2) / this.world.cell), 0, this.grid.rows - 1),
    };
  }

  getPlayerBox() {
    return {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
    };
  }

  cellToBox(cell) {
    return {
      x: cell.x * this.world.cell,
      y: cell.y * this.world.cell,
      width: this.world.cell,
      height: this.world.cell,
    };
  }

  cellCenter(cell) {
    return {
      x: cell.x * this.world.cell + this.world.cell / 2,
      y: cell.y * this.world.cell + this.world.cell / 2,
    };
  }

  spawnCoinFromCell(cell, count = 1) {
    const center = this.cellCenter(cell);
    for (let i = 0; i < count; i += 1) {
      const offsetX = (Math.random() - 0.5) * 6;
      const offsetY = (Math.random() - 0.5) * 6;
      this.coins.push({
        x: center.x + offsetX - 3,
        y: center.y + offsetY - 3,
        width: 6,
        height: 6,
      });
    }
  }

  spawnFlames(arc) {
    const angles = [arc.start, (arc.start + arc.end) / 2, arc.end];
    const radius = arc.radius * 0.7;
    angles.forEach((angle) => {
      const x = arc.x + Math.cos(angle) * radius - 5;
      const y = arc.y + Math.sin(angle) * radius - 5;
      this.flames.push({
        x,
        y,
        width: 10,
        height: 10,
        life: 2.0,
      });
    });
  }

  isSlashActive() {
    return this.player && this.player.attackTimer > 0;
  }

  getSlashArc() {
    if (!this.player) return null;
    const radiusBase = 18 + this.upgrades.slashRadius * 6;
    const arcWidth = Math.PI;
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + this.player.height / 2;
    let angle = 0;
    switch (this.player.attackDir) {
      case 'right':
        angle = 0;
        break;
      case 'left':
        angle = Math.PI;
        break;
      case 'up':
        angle = -Math.PI / 2;
        break;
      case 'down':
        angle = Math.PI / 2;
        break;
      default:
        angle = 0;
    }
    return {
      x: centerX,
      y: centerY,
      radius: radiusBase,
      start: angle - arcWidth / 2,
      end: angle + arcWidth / 2,
    };
  }

  isPointInSlash(point, slash) {
    const dx = point.x - slash.x;
    const dy = point.y - slash.y;
    const dist = Math.hypot(dx, dy);
    if (dist > slash.radius || dist < slash.radius * 0.2) return false;
    const angle = Math.atan2(dy, dx);
    return this.isAngleBetween(angle, slash.start, slash.end);
  }

  isAngleBetween(angle, start, end) {
    const twoPi = Math.PI * 2;
    let a = angle;
    let s = start;
    let e = end;
    while (a < 0) a += twoPi;
    while (s < 0) s += twoPi;
    while (e < 0) e += twoPi;
    if (s <= e) {
      return a >= s && a <= e;
    }
    return a >= s || a <= e;
  }

  triggerAttack() {
    if (this.player.attackCooldown > 0) return;
    this.player.attackDir = this.player.facing;
    this.player.attackTimer = 0.14;
    const cooldown = Math.max(0.1, 0.25 - this.upgrades.shortCooldown * 0.05);
    this.player.attackCooldown = cooldown;
    if (this.upgrades.flameSword) {
      const arc = this.getSlashArc();
      if (arc) {
        this.spawnFlames(arc);
      }
    }
    if (this.upgrades.slashProjectile) {
      const direction = this.getFacingVector();
      const center = this.getPlayerCenter();
      this.slashProjectiles.push({
        x: center.x - 3,
        y: center.y - 3,
        width: 6,
        height: 6,
        vx: direction.x,
        vy: direction.y,
        life: 0.9,
      });
    }
  }

  triggerDash() {
    if (!this.upgrades.dash) return;
    if (this.player.dashCooldown > 0) return;
    this.player.dashTimer = 0.15 + this.upgrades.dashBoost * 0.05;
    this.player.dashCooldown = 1.0;
  }

  triggerFreeze() {
    if (!this.upgrades.freeze) return;
    if (this.player.freezeCooldown > 0) return;
    this.snakes.forEach((snake) => {
      snake.freezeTimer = 2.0;
    });
    this.player.freezeCooldown = 6.0;
  }

  triggerGun() {
    if (!this.upgrades.arcaneGun) return;
    if (this.player.gunCooldown > 0) return;
    const direction = this.getFacingVector();
    const center = this.getPlayerCenter();
    this.projectiles.push({
      x: center.x - 2,
      y: center.y - 2,
      width: 4,
      height: 4,
      vx: direction.x,
      vy: direction.y,
      life: 1.2,
    });
    this.player.gunCooldown = 0.25;
  }

  getPlayerCenter() {
    return {
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
    };
  }

  placePlayerCenter() {
    const size = this.player?.width || 8;
    const centerX = this.world.width / 2;
    const centerY = this.world.height / 2;
    if (!this.player) {
      this.player = {
        x: centerX - size / 2,
        y: centerY - size / 2,
        width: size,
        height: size,
        speed: 84,
        facing: 'right',
        attackTimer: 0,
        attackCooldown: 0,
        attackDir: 'right',
        dashTimer: 0,
        dashCooldown: 0,
        freezeCooldown: 0,
        usingGun: false,
        gunCooldown: 0,
      };
      return;
    }
    this.player.x = centerX - size / 2;
    this.player.y = centerY - size / 2;
  }

  getFacingVector() {
    switch (this.player.facing) {
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      default:
        return { x: 1, y: 0 };
    }
  }

  updateHud() {
    if (this.levelLabel) this.levelLabel.textContent = `Level ${this.level}`;
    if (this.snakesLabel) this.snakesLabel.textContent = `Snakes: ${this.snakes.length}`;
    if (this.goldLabel) this.goldLabel.textContent = `Gold: ${this.gold}`;
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
    const ctx = this.worldContext;
    ctx.clearRect(0, 0, this.world.width, this.world.height);

    ctx.fillStyle = '#0f1a14';
    ctx.fillRect(0, 0, this.world.width, this.world.height);
    ctx.fillStyle = '#16241c';
    for (let x = 0; x < this.world.width; x += this.world.cell) {
      for (let y = 0; y < this.world.height; y += this.world.cell) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, this.world.cell, this.world.cell);
        }
      }
    }

    if (this.inShop) {
      this.drawShopRoom(ctx);
    }

    this.drawApples(ctx);
    this.drawCoins(ctx);
    this.drawFlames(ctx);
    this.drawShopItems(ctx);
    this.drawSnakes(ctx);
    this.drawProjectiles(ctx);
    this.drawMouse(ctx);
    this.drawSlash(ctx);
    this.drawBorders(ctx);

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const scale = Math.min(width / this.world.width, height / this.world.height);
    const drawWidth = this.world.width * scale;
    const drawHeight = this.world.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    this.context.clearRect(0, 0, width, height);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(this.worldCanvas, offsetX, offsetY, drawWidth, drawHeight);
  }

  drawShopRoom(ctx) {
    ctx.fillStyle = '#0b1510';
    ctx.fillRect(8, 8, this.world.width - 16, this.world.height - 16);
    ctx.fillStyle = '#18251e';
    ctx.fillRect(12, 12, this.world.width - 24, this.world.height - 24);
    ctx.strokeStyle = '#3a4b42';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, this.world.width - 20, this.world.height - 20);
  }

  drawMouse(ctx) {
    const { x, y, width, height } = this.player;
    ctx.fillStyle = '#d7d3c8';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#f1b3bf';
    ctx.fillRect(x + 1, y - 2, 3, 3);
    ctx.fillRect(x + width - 4, y - 2, 3, 3);
    ctx.fillStyle = '#473a2d';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillStyle = '#b9b2a6';
    ctx.fillRect(x + 1, y + height - 2, width - 2, 1);
    ctx.fillStyle = '#e2d7c9';
    ctx.fillRect(x + width - 1, y + height - 3, 1, 3);
  }

  drawSnakes(ctx) {
    if (this.inShop) return;
    this.snakes.forEach((snake) => {
      snake.segments.forEach((segment, index) => {
        const box = this.cellToBox(segment);
        if (index === 0) {
          ctx.fillStyle = snake.hitTimer > 0 ? '#ff6b6b' : '#4fbf6a';
        } else {
          ctx.fillStyle = '#3a8f52';
        }
        if (snake.freezeTimer > 0) {
          ctx.fillStyle = '#7fc8ff';
        }
        ctx.fillRect(box.x + 1, box.y + 1, box.width - 2, box.height - 2);
      });
      const headBox = this.cellToBox(snake.segments[0]);
      ctx.fillStyle = '#eaf6e5';
      ctx.fillRect(headBox.x + 2, headBox.y + 2, 2, 2);
      ctx.fillRect(headBox.x + headBox.width - 4, headBox.y + 2, 2, 2);
    });
  }

  drawApples(ctx) {
    if (this.inShop) return;
    this.apples.forEach((apple) => {
      const box = this.cellToBox(apple);
      ctx.fillStyle = '#d64343';
      ctx.fillRect(box.x + 2, box.y + 2, box.width - 4, box.height - 4);
      ctx.fillStyle = '#f6d66b';
      ctx.fillRect(box.x + 4, box.y + 1, 1, 2);
    });
  }

  drawCoins(ctx) {
    if (this.inShop) return;
    this.coins.forEach((coin) => {
      ctx.fillStyle = '#f7d57a';
      ctx.fillRect(coin.x, coin.y, coin.width, coin.height);
      ctx.fillStyle = '#b98b2f';
      ctx.fillRect(coin.x + 1, coin.y + 1, coin.width - 2, coin.height - 2);
    });
  }

  drawFlames(ctx) {
    if (this.inShop) return;
    this.flames.forEach((flame) => {
      const alpha = Math.min(1, flame.life / 2);
      ctx.fillStyle = `rgba(255, 120, 60, ${0.7 * alpha})`;
      ctx.fillRect(flame.x, flame.y, flame.width, flame.height);
      ctx.fillStyle = `rgba(255, 210, 120, ${0.8 * alpha})`;
      ctx.fillRect(flame.x + 2, flame.y + 2, flame.width - 4, flame.height - 4);
    });
  }

  drawShopItems(ctx) {
    if (!this.inShop) return;
    this.shopItems.forEach((item) => {
      const box = this.cellToBox(item.cell);
      if (item.type === 'exit') {
        ctx.fillStyle = '#2c3b34';
        ctx.fillRect(box.x - 4, box.y - 2, box.width + 8, box.height + 6);
        ctx.fillStyle = '#8ad1ff';
        ctx.fillRect(box.x, box.y, box.width, box.height + 4);
        ctx.fillStyle = '#1c2a24';
        ctx.beginPath();
        ctx.moveTo(box.x + box.width / 2, box.y - 6);
        ctx.lineTo(box.x + box.width / 2 - 4, box.y - 1);
        ctx.lineTo(box.x + box.width / 2 + 4, box.y - 1);
        ctx.closePath();
        ctx.fill();
        return;
      }
      ctx.fillStyle = item.available ? '#ffd166' : '#4d5a54';
      ctx.fillRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4);
      ctx.fillStyle = '#1c2a24';
      ctx.fillRect(box.x, box.y, box.width, box.height);

      const progress = item.hold || 0;
      if (progress > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          box.x + box.width / 2,
          box.y + box.height / 2,
          box.width * 0.65,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * progress
        );
        ctx.stroke();
      }
    });
  }

  drawProjectiles(ctx) {
    if (this.projectiles.length === 0 && this.slashProjectiles.length === 0) return;
    ctx.fillStyle = '#a2e1ff';
    this.projectiles.forEach((projectile) => {
      ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    });
    ctx.fillStyle = '#ffe6a1';
    this.slashProjectiles.forEach((projectile) => {
      ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    });
  }

  drawSlash(ctx) {
    if (!this.isSlashActive()) return;
    const slash = this.getSlashArc();
    if (!slash) return;
    const intensity = this.player.attackTimer / 0.14;
    ctx.strokeStyle = `rgba(255, 228, 152, ${0.4 + intensity * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(slash.x, slash.y, slash.radius, slash.start, slash.end);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 244, ${0.5 + intensity * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(slash.x, slash.y, slash.radius - 3, slash.start, slash.end);
    ctx.stroke();

    if (this.lingeringSlashes.length > 0) {
      this.lingeringSlashes.forEach((lingering) => {
        const alpha = Math.min(0.5, lingering.life);
        ctx.strokeStyle = `rgba(255, 170, 102, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lingering.x, lingering.y, lingering.radius, lingering.start, lingering.end);
        ctx.stroke();
      });
    }
  }

  drawBorders(ctx) {
    ctx.strokeStyle = '#3a4b42';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, this.world.width - 2, this.world.height - 2);
  }

  handleKeyDown(event) {
    if (event.repeat && !['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) return;
    if (this.pendingDeath) {
      if (event.code === 'Enter') {
        this.confirmDeath();
      }
      return;
    }
    if (this.inShop && ['Space', 'ShiftLeft', 'ShiftRight', 'KeyF', 'KeyQ'].includes(event.code)) {
      return;
    }
    if (event.code === 'KeyL') {
      this.tryCheat('KeyL');
      return;
    }
    if (event.code === 'KeyG') {
      this.tryCheat('KeyG');
      return;
    }
    if (event.code === 'KeyK') {
      this.tryCheat('KeyK');
      return;
    }
    this.keys.add(event.code);

    if (event.code === 'Space') {
      if (this.upgrades.arcaneGun && this.player.usingGun) {
        this.triggerGun();
      } else {
        this.triggerAttack();
      }
    }

    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.triggerDash();
    }

    if (event.code === 'KeyF') {
      this.triggerFreeze();
    }

    if (event.code === 'KeyQ' && this.upgrades.arcaneGun) {
      this.player.usingGun = !this.player.usingGun;
    }

    if (event.code === 'KeyR') {
      this.resetGame();
    }

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  tryCheat(code) {
    const now = performance.now();
    const history = this.cheatHistory[code] || [];
    const windowMs = 650;
    const updated = history.filter((t) => now - t < windowMs);
    updated.push(now);
    this.cheatHistory[code] = updated;
    if (updated.length >= 3) {
      this.cheatHistory[code] = [];
      if (code === 'KeyL') {
        this.skipLevels(10);
      }
      if (code === 'KeyG') {
        this.gold += 100;
        this.updateHud();
      }
      if (code === 'KeyK') {
        this.forceShop();
      }
    }
  }

  skipLevels(amount) {
    this.level += amount;
    this.coins = [];
    if (this.level % SHOP_INTERVAL === 0) {
      this.openShop();
      return;
    }
    this.resetLevel();
    this.startCountdown();
  }

  forceShop() {
    const targetLevel = Math.max(SHOP_INTERVAL, Math.ceil(this.level / SHOP_INTERVAL) * SHOP_INTERVAL);
    this.level = targetLevel;
    this.coins = [];
    this.updateHud();
    this.openShop();
  }
}
