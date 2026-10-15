import { LEVELS } from './phases.js';

export class GameEngine {
  constructor({ canvas, onStateChange, onWin }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onStateChange = onStateChange || (() => {});
    this.onWin = onWin || (() => {});
    this.state = {
      levelIndex: 0,
      xp: 0,
      life: 3,
      correct: false,
      unlocked: 0,
      completed: 0,
      soundOn: true
    };
    this.player = { x: 1, y: 1 };
    this.coins = [];
    this.enemies = [];
    this.grid = [];
    this.lastEnemyMove = 0;
  }

  setupLevel(index) {
    const level = LEVELS[index];
    this.state.levelIndex = index;
    this.grid = level.map.map((row) => row.split(''));
    this.coins = level.coins.map(([x, y]) => ({ x, y, collected: false }));
    this.enemies = level.enemies.map(([x, y]) => ({ x, y }));

    for (let y = 0; y < this.grid.length; y += 1) {
      for (let x = 0; x < this.grid[y].length; x += 1) {
        if (this.grid[y][x] === 'P') {
          this.player.x = x;
          this.player.y = y;
          this.grid[y][x] = '.';
        }
      }
    }

    this.state.correct = false;
    this.render();
    this.onStateChange(this.state);
  }

  setProgress(next) {
    this.state = { ...this.state, ...next };
    this.onStateChange(this.state);
  }

  free(x, y) {
    return y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length && this.grid[y][x] !== '#';
  }

  collectCoin() {
    for (const coin of this.coins) {
      if (!coin.collected && coin.x === this.player.x && coin.y === this.player.y) {
        coin.collected = true;
        this.state.xp += 10;
      }
    }
  }

  checkCollision() {
    for (const enemy of this.enemies) {
      if (enemy.x === this.player.x && enemy.y === this.player.y) {
        this.state.life -= 1;
        this.player.x = 1;
        this.player.y = 1;
        if (this.state.life <= 0) {
          this.state.life = 3;
          this.setupLevel(this.state.levelIndex);
        }
        break;
      }
    }
  }

  move(dx, dy) {
    const nextX = this.player.x + dx;
    const nextY = this.player.y + dy;
    if (!this.free(nextX, nextY)) return;

    this.player.x = nextX;
    this.player.y = nextY;
    this.collectCoin();
    this.checkCollision();
    this.render();
    this.onStateChange(this.state);
  }

  tick() {
    const now = Date.now();
    if (now - this.lastEnemyMove < 500) return;
    this.lastEnemyMove = now;

    for (const enemy of this.enemies) {
      const steps = [
        [1, 0], [0, 1], [-1, 0], [0, -1]
      ];
      const dir = steps[Math.floor(Math.random() * steps.length)];
      const nx = enemy.x + dir[0];
      const ny = enemy.y + dir[1];
      if (this.free(nx, ny)) {
        enemy.x = nx;
        enemy.y = ny;
      }
    }

    this.checkCollision();
    this.render();
  }

  render() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0b2136';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = 32;
    const rows = this.grid.length;
    const cols = this.grid[0].length;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const tile = this.grid[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        if (tile === '#') {
          ctx.fillStyle = '#325a7d';
          ctx.fillRect(px, py, tileSize, tileSize);
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#173554' : '#102c45';
          ctx.fillRect(px, py, tileSize, tileSize);
        }

        if (tile === 'E') {
          ctx.fillStyle = this.state.correct ? '#90EE90' : '#f0c95e';
          ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
          ctx.fillStyle = '#0a1a2c';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('🚪', px + 8, py + 22);
        }
      }
    }

    for (const coin of this.coins) {
      if (!coin.collected) {
        ctx.fillStyle = '#f5c65b';
        ctx.fillText('🪙', coin.x * tileSize + 8, coin.y * tileSize + 24);
      }
    }

    for (const enemy of this.enemies) {
      ctx.fillStyle = '#d9534f';
      ctx.fillText('👾', enemy.x * tileSize + 8, enemy.y * tileSize + 24);
    }

    ctx.fillStyle = '#eaf6ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('🧑‍🚀', this.player.x * tileSize + 8, this.player.y * tileSize + 24);
  }
}
