const GRID_SIZE = 24;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const TICK_MS = 120;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};
const START_DIRECTION = DIRECTIONS.ArrowRight;
const START_SNAKE = [
  { x: 11, y: 12 },
  { x: 10, y: 12 },
  { x: 9, y: 12 },
];
const START_FOOD = { x: 17, y: 12 };

const state = {
  snake: [...START_SNAKE],
  food: START_FOOD,
  score: 0,
  bestScore: 0,
  phase: 'ready',
  direction: START_DIRECTION,
  movementDirection: START_DIRECTION,
  timer: null,
};

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isReverse(nextDirection, currentDirection) {
  return nextDirection.x + currentDirection.x === 0 && nextDirection.y + currentDirection.y === 0;
}

function createFood(snake) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const openCells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        openCells.push({ x, y });
      }
    }
  }
  return openCells.length > 0 ? openCells[Math.floor(Math.random() * openCells.length)] : null;
}

function statusText() {
  return {
    ready: '准备开始',
    playing: '游戏进行中',
    paused: '已暂停',
    gameover: '游戏结束',
  }[state.phase];
}

function drawPixelRect(context, x, y, color, inset = 1) {
  context.fillStyle = color;
  context.fillRect(x * CELL_SIZE + inset, y * CELL_SIZE + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2);
}

function draw() {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  context.fillStyle = '#111827';
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.strokeStyle = '#1f2937';
  context.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const position = i * CELL_SIZE + 0.5;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }

  if (state.food) {
    drawPixelRect(context, state.food.x, state.food.y, '#ef4444', 3);
    drawPixelRect(context, state.food.x, state.food.y, '#fecaca', 7);
  }

  state.snake.forEach((segment, index) => {
    drawPixelRect(context, segment.x, segment.y, index === 0 ? '#bef264' : '#22c55e', 2);
    drawPixelRect(context, segment.x, segment.y, index === 0 ? '#4d7c0f' : '#15803d', 7);
  });
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <main class="app-shell">
      <section class="game-card">
        <header class="game-header">
          <div>
            <p class="eyebrow">Windows 本地小游戏</p>
            <h1>像素贪吃蛇</h1>
          </div>
          <div class="score-board" aria-label="分数面板">
            <div><span>当前分数</span><strong>${state.score}</strong></div>
            <div><span>最高分</span><strong>${state.bestScore}</strong></div>
          </div>
        </header>
        <div class="canvas-wrap">
          <canvas width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" aria-label="贪吃蛇游戏画布"></canvas>
          ${state.phase !== 'playing' ? `
            <div class="overlay" role="status" aria-live="polite">
              <p class="overlay-kicker">${statusText()}</p>
              <h2>${state.phase === 'gameover' ? '撞到了！' : '按方向键开始移动'}</h2>
              <p>使用 ↑ ↓ ← → 控制方向，空格键暂停/继续。蛇不能直接反向掉头，撞墙或撞到身体就会结束。</p>
            </div>` : ''}
        </div>
        <footer class="controls">
          <button type="button" data-action="start">${state.phase === 'ready' ? '开始游戏' : '重新开始'}</button>
          <button type="button" data-action="pause" ${state.phase === 'gameover' ? 'disabled' : ''}>${state.phase === 'paused' ? '继续' : '暂停'}</button>
          <span class="status-pill">${statusText()}</span>
        </footer>
      </section>
    </main>`;

  root.querySelector('[data-action="start"]').addEventListener('click', startGame);
  root.querySelector('[data-action="pause"]').addEventListener('click', togglePause);
  draw();
}

function setPhase(nextPhase) {
  state.phase = nextPhase;
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
  if (nextPhase === 'playing') {
    state.timer = window.setInterval(tick, TICK_MS);
  }
  render();
}

function resetGame(nextPhase = 'ready') {
  state.snake = [...START_SNAKE];
  state.food = START_FOOD;
  state.score = 0;
  state.direction = START_DIRECTION;
  state.movementDirection = START_DIRECTION;
  setPhase(nextPhase);
}

function startGame() {
  resetGame('playing');
}

function togglePause() {
  if (state.phase === 'playing') {
    setPhase('paused');
  } else if (state.phase === 'paused') {
    setPhase('playing');
  } else if (state.phase === 'ready') {
    startGame();
  }
}

function tick() {
  const head = state.snake[0];
  state.movementDirection = state.direction;
  const nextHead = { x: head.x + state.direction.x, y: head.y + state.direction.y };
  const ateFood = state.food && sameCell(nextHead, state.food);
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitWall = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
  const hitSelf = collisionBody.some((segment) => sameCell(segment, nextHead));

  if (hitWall || hitSelf) {
    setPhase('gameover');
    return;
  }

  state.snake = ateFood ? [nextHead, ...state.snake] : [nextHead, ...state.snake.slice(0, -1)];
  if (ateFood) {
    state.score += 10;
    state.bestScore = Math.max(state.bestScore, state.score);
    state.food = createFood(state.snake);
  }
  render();
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
    return;
  }

  const nextDirection = DIRECTIONS[event.key];
  if (!nextDirection) {
    return;
  }

  event.preventDefault();
  if (state.phase === 'ready') {
    startGame();
  }
  if (state.phase === 'playing' && !isReverse(nextDirection, state.movementDirection)) {
    state.direction = nextDirection;
  }
});

render();
