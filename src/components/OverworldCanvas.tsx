import { useEffect, useRef, useState } from 'react';
import { ROOMS } from '../game/narrativeData';
import { TILE_SIZE } from '../game/combatEngine';
import {
  HERO_SPRITE_DOWN,
  HERO_SPRITE_DOWN_WALK,
  HERO_SPRITE_SIDE,
  HERO_SPRITE_UP,
  PEDESTAL_SPRITE,
  SAVE_STAR_SPRITE,
  TABLET_SPRITE,
  drawPixelSprite,
  getEnemySprite,
} from '../game/pixelSprites';
import type { Direction, InteractableEntity, PortalZone, WorldProgress } from '../game/types';

interface OverworldCanvasProps {
  progress: WorldProgress;
  paused: boolean;
  dialogueOpen: boolean;
  onMoveUpdate: (x: number, y: number, dir: Direction) => void;
  onPortalEnter: (portal: PortalZone) => void;
  onInteract: (entity: InteractableEntity) => void;
}

export function OverworldCanvas({
  progress,
  paused,
  dialogueOpen,
  onMoveUpdate,
  onPortalEnter,
  onInteract,
}: OverworldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const posRef = useRef({ x: progress.playerX, y: progress.playerY, dir: progress.playerDir });
  const portalCooldownRef = useRef(0);
  const callbacksRef = useRef({ onMoveUpdate, onPortalEnter, onInteract });
  callbacksRef.current = { onMoveUpdate, onPortalEnter, onInteract };

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const stateLockRef = useRef({ paused, dialogueOpen });
  stateLockRef.current = { paused, dialogueOpen };

  const [nearbyEntity, setNearbyEntity] = useState<InteractableEntity | null>(null);
  const nearbyRef = useRef<InteractableEntity | null>(null);

  // Sync position when room changes or reset occurs
  useEffect(() => {
    posRef.current = { x: progress.playerX, y: progress.playerY, dir: progress.playerDir };
    portalCooldownRef.current = 0.25;
  }, [progress.room, progress.playerX, progress.playerY, progress.playerDir]);

  // Clear stuck keys on blur or dialogue opening
  useEffect(() => {
    const clearKeys = () => keysRef.current.clear();
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', clearKeys);
    return () => {
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', clearKeys);
    };
  }, []);

  useEffect(() => {
    if (paused || dialogueOpen) {
      keysRef.current.clear();
    }
  }, [paused, dialogueOpen]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stateLockRef.current.paused || stateLockRef.current.dialogueOpen) return;

      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
      }

      if (k === 'z' || k === 'enter' || k === ' ') {
        if (nearbyRef.current) {
          e.preventDefault();
          callbacksRef.current.onInteract(nearbyRef.current);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main 60 FPS Canvas2D simulation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let last = performance.now();
    let walkDist = 0;

    const isWalkable = (px: number, py: number) => {
      const room = ROOMS[progressRef.current.room];
      const half = 9;
      const corners = [
        [px - half, py - half + 4],
        [px + half, py - half + 4],
        [px - half, py + half],
        [px + half, py + half],
      ];
      for (const [cx, cy] of corners) {
        const tx = Math.floor(cx / TILE_SIZE);
        const ty = Math.floor(cy / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= room.width || ty >= room.height) return false;
        const tile = room.tiles[ty][tx];
        if (tile === 1 || tile === 2) return false;
      }

      // Collide with non-slain solid interactables (except floor items/stars allow soft proximity)
      for (const ent of room.interactables) {
        if (ent.enemyId && progressRef.current.slainEnemies.includes(ent.enemyId)) continue;
        const ex = (ent.x + 0.5) * TILE_SIZE;
        const ey = (ent.y + 0.5) * TILE_SIZE;
        if (Math.hypot(px - ex, py - ey) < 18) return false;
      }

      return true;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const room = ROOMS[progressRef.current.room];
      if (portalCooldownRef.current > 0) {
        portalCooldownRef.current = Math.max(0, portalCooldownRef.current - dt);
      }

      // Movement step
      if (!stateLockRef.current.paused && !stateLockRef.current.dialogueOpen) {
        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
        if (keys.has('arrowright') || keys.has('d')) dx += 1;
        if (keys.has('arrowup') || keys.has('w')) dy -= 1;
        if (keys.has('arrowdown') || keys.has('s')) dy += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          const speed = 112; // px/sec
          const vx = (dx / len) * speed * dt;
          const vy = (dy / len) * speed * dt;

          if (Math.abs(dx) >= Math.abs(dy)) {
            posRef.current.dir = dx < 0 ? 'left' : 'right';
          } else {
            posRef.current.dir = dy < 0 ? 'up' : 'down';
          }

          const nextX = posRef.current.x + vx;
          if (isWalkable(nextX, posRef.current.y)) {
            posRef.current.x = nextX;
            walkDist += Math.abs(vx);
          }

          const nextY = posRef.current.y + vy;
          if (isWalkable(posRef.current.x, nextY)) {
            posRef.current.y = nextY;
            walkDist += Math.abs(vy);
          }

          callbacksRef.current.onMoveUpdate(
            posRef.current.x,
            posRef.current.y,
            posRef.current.dir
          );
        }

        // Check portals
        if (portalCooldownRef.current <= 0) {
          const tx = Math.floor(posRef.current.x / TILE_SIZE);
          const ty = Math.floor(posRef.current.y / TILE_SIZE);
          for (const portal of room.portals) {
            if (
              tx >= portal.x &&
              tx < portal.x + portal.w &&
              ty >= portal.y &&
              ty < portal.y + portal.h
            ) {
              portalCooldownRef.current = 0.5;
              callbacksRef.current.onPortalEnter(portal);
              break;
            }
          }
        }
      }

      // Find nearest interactable within 44px
      let closest: InteractableEntity | null = null;
      let bestDist = 44;
      for (const ent of room.interactables) {
        if (ent.enemyId && progressRef.current.slainEnemies.includes(ent.enemyId)) continue;
        const ex = (ent.x + 0.5) * TILE_SIZE;
        const ey = (ent.y + 0.5) * TILE_SIZE;
        const d = Math.hypot(posRef.current.x - ex, posRef.current.y - ey);
        if (d < bestDist) {
          bestDist = d;
          closest = ent;
        }
      }
      if (closest?.id !== nearbyRef.current?.id) {
        nearbyRef.current = closest;
        setNearbyEntity(closest);
      }

      // Render world centered on canvas
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mapPixelW = room.width * TILE_SIZE;
      const mapPixelH = room.height * TILE_SIZE;
      const offsetX = Math.floor((canvas.width - mapPixelW) / 2);
      const offsetY = Math.floor((canvas.height - mapPixelH) / 2);

      // Draw tiles
      for (let ty = 0; ty < room.height; ty++) {
        for (let tx = 0; tx < room.width; tx++) {
          const tile = room.tiles[ty][tx];
          const px = offsetX + tx * TILE_SIZE;
          const py = offsetY + ty * TILE_SIZE;

          if (tile === 0 || tile === 3 || tile === 4) {
            ctx.fillStyle = room.floorColor;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Subtle pixel stone tile joint
            ctx.fillStyle = 'rgba(255,255,255,0.035)';
            ctx.fillRect(px, py, TILE_SIZE, 1);
            ctx.fillRect(px, py, 1, TILE_SIZE);

            if (tile === 3) {
              ctx.fillStyle = room.accentColor;
              ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              ctx.fillStyle = 'rgba(255,255,255,0.06)';
              ctx.fillRect(px + 6, py + 6, 4, 4);
              ctx.fillRect(px + 20, py + 18, 4, 4);
            }

            if (tile === 4) {
              // Glowing passage archway
              ctx.fillStyle = '#FFE135';
              ctx.globalAlpha = 0.22 + 0.1 * Math.sin(now * 0.004);
              ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              ctx.globalAlpha = 1;
              ctx.fillStyle = '#FFE135';
              ctx.fillRect(px + 12, py + 12, 8, 8);
            }
          } else if (tile === 1) {
            ctx.fillStyle = room.wallColor;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = room.wallTopColor;
            ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 10);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
          } else if (tile === 2) {
            ctx.fillStyle = '#0A192F';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            const shimmer = Math.sin(now * 0.003 + tx + ty) > 0.2;
            ctx.fillStyle = shimmer ? '#38BDF8' : '#1D4ED8';
            ctx.globalAlpha = 0.35;
            ctx.fillRect(px + 6, py + 10, 12, 3);
            ctx.fillRect(px + 14, py + 22, 10, 3);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Collect Y-sorted actors (interactables + player)
      const drawList: { y: number; draw: () => void }[] = [];

      for (const ent of room.interactables) {
        if (ent.enemyId && progressRef.current.slainEnemies.includes(ent.enemyId)) continue;
        const ex = offsetX + (ent.x + 0.5) * TILE_SIZE;
        const ey = offsetY + (ent.y + 0.5) * TILE_SIZE;
        const isSpared = ent.enemyId ? progressRef.current.sparedEnemies.includes(ent.enemyId) : false;
        const isCollected = progressRef.current.collectedItems.includes(ent.id);

        drawList.push({
          y: ey,
          draw: () => {
            const bob = ent.kind === 'save_star' ? Math.round(Math.sin(now * 0.005) * 2) : 0;
            if (ent.kind === 'save_star') {
              drawPixelSprite(ctx, SAVE_STAR_SPRITE, ex - 12, ey - 10 + bob, 2);
            } else if (ent.kind === 'tablet') {
              drawPixelSprite(ctx, TABLET_SPRITE, ex - 12, ey - 8, 2);
            } else if (ent.kind === 'item_pedestal') {
              drawPixelSprite(ctx, PEDESTAL_SPRITE, ex - 12, ey - 10, 2, {
                alpha: isCollected ? 0.55 : 1,
              });
            } else {
              const sprite = getEnemySprite(ent.spriteKey);
              drawPixelSprite(ctx, sprite, ex - 14, ey - 16, 2, {
                alpha: isSpared ? 0.75 : 1,
              });
              if (isSpared) {
                // Friendly yellow sparkle indicator for spared allies
                ctx.fillStyle = '#FFE135';
                ctx.fillRect(Math.round(ex - 2), Math.round(ey - 22 + Math.sin(now * 0.006) * 2), 4, 4);
              }
            }

            // Highlight ring when interactable is in range
            if (nearbyRef.current?.id === ent.id) {
              ctx.strokeStyle = '#FFE135';
              ctx.lineWidth = 2;
              ctx.strokeRect(Math.round(ex - 16), Math.round(ey - 16), 32, 32);
            }
          },
        });
      }

      // Player sprite
      const px = offsetX + posRef.current.x;
      const py = offsetY + posRef.current.y;
      drawList.push({
        y: py,
        draw: () => {
          const walkFrame = Math.floor(walkDist / 12) % 2 === 1;
          const dir = posRef.current.dir;
          const sprite =
            dir === 'up'
              ? HERO_SPRITE_UP
              : dir === 'left' || dir === 'right'
              ? HERO_SPRITE_SIDE
              : walkFrame
              ? HERO_SPRITE_DOWN_WALK
              : HERO_SPRITE_DOWN;
          drawPixelSprite(ctx, sprite, px - 14, py - 16, 2, { flipX: dir === 'left' });
        },
      });

      drawList.sort((a, b) => a.y - b.y);
      for (const item of drawList) item.draw();

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Touch / click D-pad helper for mobile & mouse accessibility
  const bindHoldKey = (key: string) => ({
    onPointerDown: () => keysRef.current.add(key),
    onPointerUp: () => keysRef.current.delete(key),
    onPointerLeave: () => keysRef.current.delete(key),
    onPointerCancel: () => keysRef.current.delete(key),
  });

  const room = ROOMS[progress.room];
  const roomPixelW = room.width * TILE_SIZE;
  const roomPixelH = room.height * TILE_SIZE;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#050508] p-4">
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={roomPixelW}
          height={roomPixelH}
          data-testid="overworld-canvas"
          className="pixelated h-auto w-full max-w-[740px] max-h-[68vh] border-4 border-white bg-[#050508] shadow-2xl"
        />

        {/* Nearby contextual interact CTA (only appears when next to an object/NPC) */}
        {nearbyEntity && !dialogueOpen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => onInteract(nearbyEntity)}
              className="ut-btn font-pixel-display cursor-pointer px-4 py-2 text-xs tracking-wider shadow-lg whitespace-nowrap"
            >
              [Z / Enter] {nearbyEntity.kind === 'enemy' ? `Confront ${nearbyEntity.name}` : `Inspect ${nearbyEntity.name}`}
            </button>
          </div>
        )}
      </div>

      {/* Bottom room descriptor + accessible touch D-pad on small screens */}
      {!dialogueOpen && (
        <div className="mt-3 flex w-full max-w-[740px] flex-wrap items-center justify-between gap-3 px-1">
          <div className="font-pixel-body text-lg text-slate-300 whitespace-nowrap">
            <span className="text-white">{room.title}</span>
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-400">{room.subtitle}</span>
          </div>

          {/* Compact on-screen D-pad for touch/mouse users */}
          <div className="flex items-center gap-1.5 sm:hidden" aria-label="Movement controls">
            <button
              type="button"
              aria-label="Move Left"
              className="h-10 w-10 border-2 border-white/60 bg-black font-pixel-display text-xs text-white"
              {...bindHoldKey('arrowleft')}
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Move Up"
              className="h-10 w-10 border-2 border-white/60 bg-black font-pixel-display text-xs text-white"
              {...bindHoldKey('arrowup')}
            >
              ▲
            </button>
            <button
              type="button"
              aria-label="Move Down"
              className="h-10 w-10 border-2 border-white/60 bg-black font-pixel-display text-xs text-white"
              {...bindHoldKey('arrowdown')}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Move Right"
              className="h-10 w-10 border-2 border-white/60 bg-black font-pixel-display text-xs text-white"
              {...bindHoldKey('arrowright')}
            >
              ▶
            </button>
          </div>

          <p className="hidden sm:block font-pixel-body text-base text-slate-400 whitespace-nowrap">
            Walk to glowing archways to advance · Z/Enter to interact
          </p>
        </div>
      )}
    </div>
  );
}
