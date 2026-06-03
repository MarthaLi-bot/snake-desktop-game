import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

  if (openCells.length === 0) {
    return null;
  }

  return openCells[Math.floor(Math.random() * openCells.length)];
}

function drawPixelRect(context, x, y, color, inset = 1) {
  context.fillStyle = color;
  context.fillRect(x * CELL_SIZE + inset, y * CELL_SIZE + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2);
}

function App() {
  const canvasRef = useRef(null);
  const directionRef = useRef(START_DIRECTION);
  const movementDirectionRef = useRef(START_DIRECTION);
  const phaseRef = useRef('ready');
  const foodRef = useRef(START_FOOD);
  const scoreRef = useRef(0);

  const [snake, setSnake] = useState(START_SNAKE);
  const [food, setFood] = useState(START_FOOD);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [phase, setPhase] = useState('ready');

  const updatePhase = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const updateScore = useCallback((nextScore) => {
    scoreRef.current = nextScore;
    setScore(nextScore);
    setBestScore((currentBest) => Math.max(currentBest, nextScore));
  }, []);

  const resetGame = useCallback((nextPhase = 'ready') => {
    directionRef.current = START_DIRECTION;
    movementDirectionRef.current = START_DIRECTION;
    foodRef.current = START_FOOD;
    scoreRef.current = 0;
    setSnake(START_SNAKE);
    setFood(START_FOOD);
    setScore(0);
    updatePhase(nextPhase);
  }, [updatePhase]);

  const startGame = useCallback(() => {
    resetGame('playing');
  }, [resetGame]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') {
      updatePhase('paused');
      return;
    }

    if (phaseRef.current === 'paused') {
      updatePhase('playing');
      return;
    }

    if (phaseRef.current === 'ready') {
      startGame();
    }
  }, [startGame, updatePhase]);

  useEffect(() => {
    function handleKeyDown(event) {
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

      if (phaseRef.current === 'ready') {
        startGame();
      }

      if (phaseRef.current !== 'playing') {
        return;
      }

      if (!isReverse(nextDirection, movementDirectionRef.current)) {
        directionRef.current = nextDirection;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, togglePause]);

  useEffect(() => {
    if (phase !== 'playing') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        const direction = directionRef.current;
        movementDirectionRef.current = direction;
        const head = currentSnake[0];
        const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
        const ateFood = foodRef.current && sameCell(nextHead, foodRef.current);
        const collisionBody = ateFood ? currentSnake : currentSnake.slice(0, -1);
        const hitWall = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
        const hitSelf = collisionBody.some((segment) => sameCell(segment, nextHead));

        if (hitWall || hitSelf) {
          updatePhase('gameover');
          return currentSnake;
        }

        const nextSnake = ateFood ? [nextHead, ...currentSnake] : [nextHead, ...currentSnake.slice(0, -1)];

        if (ateFood) {
          const nextScore = scoreRef.current + 10;
          const nextFood = createFood(nextSnake);
          updateScore(nextScore);
          foodRef.current = nextFood;
          setFood(nextFood);
        }

        return nextSnake;
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [phase, updatePhase, updateScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
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

    if (food) {
      drawPixelRect(context, food.x, food.y, '#ef4444', 3);
      drawPixelRect(context, food.x, food.y, '#fecaca', 7);
    }

    snake.forEach((segment, index) => {
      const color = index === 0 ? '#bef264' : '#22c55e';
      drawPixelRect(context, segment.x, segment.y, color, 2);
      drawPixelRect(context, segment.x, segment.y, index === 0 ? '#4d7c0f' : '#15803d', 7);
    });
  }, [food, snake]);

  const statusText = {
    ready: '准备开始',
    playing: '游戏进行中',
    paused: '已暂停',
    gameover: '游戏结束',
  }[phase];

  return (
    <main className="app-shell">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Windows 本地小游戏</p>
            <h1>像素贪吃蛇</h1>
          </div>
          <div className="score-board" aria-label="分数面板">
            <div>
              <span>当前分数</span>
              <strong>{score}</strong>
            </div>
            <div>
              <span>最高分</span>
              <strong>{bestScore}</strong>
            </div>
          </div>
        </header>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} aria-label="贪吃蛇游戏画布" />
          {phase !== 'playing' && (
            <div className="overlay" role="status" aria-live="polite">
              <p className="overlay-kicker">{statusText}</p>
              <h2>{phase === 'gameover' ? '撞到了！' : '按方向键开始移动'}</h2>
              <p>
                使用 ↑ ↓ ← → 控制方向，空格键暂停/继续。蛇不能直接反向掉头，撞墙或撞到身体就会结束。
              </p>
            </div>
          )}
        </div>

        <footer className="controls">
          <button type="button" onClick={startGame}>{phase === 'ready' ? '开始游戏' : '重新开始'}</button>
          <button type="button" onClick={togglePause} disabled={phase === 'gameover'}>
            {phase === 'paused' ? '继续' : '暂停'}
          </button>
          <span className="status-pill">{statusText}</span>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
