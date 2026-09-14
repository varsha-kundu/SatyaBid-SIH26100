import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

// An original, lightweight 3-lane "dodge the obstacle" runner, themed as a
// procurement vehicle avoiding compliance-issue obstacles on a scrolling
// road. Drawn entirely with canvas primitives — no external art, no audio,
// no third-party game code. Not a clone of any specific existing game;
// only the "endless runner while offline" concept is the same idea as the
// well-known browser dinosaur game.

const LANES = 3;
const LANE_WIDTH = 90;
const CAR_W = 34;
const CAR_H = 54;

interface Obstacle {
  lane: number;
  y: number;
  passed: boolean;
}

export function CarGame({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem('satyabid_game_best') || 0));
  const [running, setRunning] = useState(true);
  const laneRef = useRef(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(4);
  const roadOffsetRef = useRef(0);
  const scoreRef = useRef(0);
  const runningRef = useRef(true);
  const frameRef = useRef<number>(0);

  const restart = () => {
    laneRef.current = 1;
    obstaclesRef.current = [];
    speedRef.current = 4;
    scoreRef.current = 0;
    setScore(0);
    runningRef.current = true;
    setRunning(true);
  };

  const moveLane = (dir: -1 | 1) => {
    laneRef.current = Math.min(LANES - 1, Math.max(0, laneRef.current + dir));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!runningRef.current) {
          restart();
          return;
        }
        moveLane(laneRef.current === 0 ? 1 : -1);
      }
      if (e.code === 'ArrowLeft') moveLane(-1);
      if (e.code === 'ArrowRight') moveLane(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const roadLeft = (width - LANES * LANE_WIDTH) / 2;

    let lastSpawn = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = now - last;
      last = now;

      if (runningRef.current) {
        roadOffsetRef.current = (roadOffsetRef.current + speedRef.current) % 40;
        speedRef.current = Math.min(11, speedRef.current + 0.0012 * dt);

        lastSpawn += dt;
        const spawnEvery = Math.max(650, 1250 - speedRef.current * 60);
        if (lastSpawn > spawnEvery) {
          lastSpawn = 0;
          obstaclesRef.current.push({ lane: Math.floor(Math.random() * LANES), y: -60, passed: false });
        }

        obstaclesRef.current.forEach((o) => {
          o.y += speedRef.current;
          if (!o.passed && o.y > height - 100) {
            o.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        });

        // collision check against player rect
        const playerX = roadLeft + laneRef.current * LANE_WIDTH + (LANE_WIDTH - CAR_W) / 2;
        const playerY = height - 110;
        const hit = obstaclesRef.current.find(
          (o) =>
            o.y + 44 > playerY &&
            o.y < playerY + CAR_H &&
            roadLeft + o.lane * LANE_WIDTH + (LANE_WIDTH - 30) / 2 < playerX + CAR_W &&
            roadLeft + o.lane * LANE_WIDTH + (LANE_WIDTH - 30) / 2 + 30 > playerX
        );
        if (hit) {
          runningRef.current = false;
          setRunning(false);
          if (scoreRef.current > best) {
            setBest(scoreRef.current);
            localStorage.setItem('satyabid_game_best', String(scoreRef.current));
          }
        }

        obstaclesRef.current = obstaclesRef.current.filter((o) => o.y < height + 80);
      }

      // ---- draw ----
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#062A35';
      ctx.fillRect(0, 0, width, height);

      // road
      ctx.fillStyle = '#0B3540';
      ctx.fillRect(roadLeft, 0, LANES * LANE_WIDTH, height);

      // lane dashes
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 18]);
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(roadLeft + i * LANE_WIDTH, -40 + roadOffsetRef.current);
        ctx.lineTo(roadLeft + i * LANE_WIDTH, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // road edges (tricolour accent)
      ctx.fillStyle = '#E87516';
      ctx.fillRect(roadLeft - 4, 0, 4, height);
      ctx.fillStyle = '#6FA36A';
      ctx.fillRect(roadLeft + LANES * LANE_WIDTH, 0, 4, height);

      // obstacles = compliance issue blocks
      obstaclesRef.current.forEach((o) => {
        const ox = roadLeft + o.lane * LANE_WIDTH + (LANE_WIDTH - 30) / 2;
        ctx.fillStyle = '#C83C3C';
        ctx.fillRect(ox, o.y, 30, 26);
        ctx.fillStyle = 'white';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', ox + 15, o.y + 18);
      });

      // player car
      const playerX = roadLeft + laneRef.current * LANE_WIDTH + (LANE_WIDTH - CAR_W) / 2;
      const playerY = height - 110;
      ctx.fillStyle = '#E87516';
      ctx.beginPath();
      ctx.roundRect(playerX, playerY, CAR_W, CAR_H, 6);
      ctx.fill();
      ctx.fillStyle = '#062A35';
      ctx.fillRect(playerX + 5, playerY + 10, CAR_W - 10, 14);
      ctx.fillStyle = '#F5F7F8';
      ctx.fillRect(playerX + 5, playerY + 34, CAR_W - 10, 8);

      // score
      ctx.fillStyle = 'white';
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${t('game_score')}: ${scoreRef.current}`, 14, 22);

      if (!runningRef.current) {
        ctx.fillStyle = 'rgba(10,25,48,0.72)';
        ctx.fillRect(0, 0, width, height);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={300}
        height={420}
        className="rounded-md border border-white/10"
        onClick={() => (running ? moveLane(laneRef.current === 0 ? 1 : -1) : restart())}
      />
      <p className="text-center text-xs text-white/60">{t('game_instructions')}</p>
      <div className="flex items-center gap-4 text-sm text-white/85">
        <span>{t('game_score')}: {score}</span>
        <span>{t('game_best')}: {best}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={restart} className="rounded-md bg-saffron-500 px-4 py-2 text-sm font-medium text-white hover:bg-saffron-600">
          {t('game_restart')}
        </button>
        <button onClick={onExit} className="rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5">
          {t('game_exit')}
        </button>
      </div>
    </div>
  );
}
