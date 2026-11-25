import { useEffect, useRef, useState } from 'react';
import {
  calculateEnemyDamageTaken,
  calculateFightDamage,
  checkBulletCollision,
  clampSoulPosition,
  isEnemySpareable,
} from '../game/combatEngine';
import { drawSoulHeart } from '../game/pixelSprites';
import { soundEngine } from '../game/soundEngine';
import type {
  ActOption,
  BulletEntity,
  BulletPatternType,
  EnemyDefinition,
  InventoryItem,
  PlayerStats,
} from '../game/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

type CombatPhase =
  | 'menu'
  | 'submenu_act'
  | 'submenu_item'
  | 'submenu_mercy'
  | 'fight_bar'
  | 'player_result'
  | 'enemy_turn'
  | 'victory_outro';

type ActionCategory = 'FIGHT' | 'ACT' | 'ITEM' | 'MERCY';
const ACTION_LIST: ActionCategory[] = ['FIGHT', 'ACT', 'ITEM', 'MERCY'];

interface CombatArenaProps {
  enemy: EnemyDefinition;
  playerStats: PlayerStats;
  inventory: InventoryItem[];
  paused: boolean;
  onPlayerDamaged: (amount: number) => void;
  onPlayerHeal: (amount: number, atkBoost?: number) => void;
  onConsumeItem: (index: number) => void;
  onTurnAdvance: () => void;
  onCombatComplete: (outcome: 'spared' | 'slain' | 'fled') => void;
}

export function CombatArena({
  enemy,
  playerStats,
  inventory,
  paused,
  onPlayerDamaged,
  onPlayerHeal,
  onConsumeItem,
  onTurnAdvance,
  onCombatComplete,
}: CombatArenaProps) {
  const [phase, setPhase] = useState<CombatPhase>('menu');
  const [selectedAction, setSelectedAction] = useState<number>(0);
  const [subIndex, setSubIndex] = useState<number>(0);

  const [enemyHp, setEnemyHp] = useState<number>(enemy.maxHp);
  const [mercyProgress, setMercyProgress] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(0);

  const [boxMessage, setBoxMessage] = useState<string>(enemy.introText);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [enemyBubble, setEnemyBubble] = useState<string | null>(null);
  const [damagePopup, setDamagePopup] = useState<{ text: string; isCrit: boolean } | null>(null);
  const [enemyFlash, setEnemyFlash] = useState<boolean>(false);
  const [enemyShake, setEnemyShake] = useState<boolean>(false);
  const [arenaShake, setArenaShake] = useState<boolean>(false);
  const [battleOutcome, setBattleOutcome] = useState<'spared' | 'slain' | 'fled' | null>(null);

  // Fight timing bar state
  const [reticlePos, setReticlePos] = useState<number>(0);
  const reticleRef = useRef<number>(0);
  const reticleLockedRef = useRef<boolean>(false);

  // Bullet box refs
  const bulletCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pointerTargetRef = useRef<{ x: number; y: number } | null>(null);
  const statsRef = useRef(playerStats);
  statsRef.current = playerStats;

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const inputReadyAtRef = useRef<number>(performance.now() + 200);

  const spareReady = isEnemySpareable(enemy, mercyProgress, enemyHp);

  // Typewriter animation for narrative battle box
  useEffect(() => {
    setTypedChars(0);
  }, [boxMessage]);

  useEffect(() => {
    if (typedChars >= boxMessage.length) return;
    const t = window.setTimeout(() => {
      const next = typedChars + 1;
      setTypedChars(next);
      if (boxMessage[next - 1] !== ' ') {
        soundEngine.playTextBlip(380);
      }
    }, 18);
    return () => window.clearTimeout(t);
  }, [typedChars, boxMessage]);

  // Fight bar oscillation loop
  useEffect(() => {
    if (phase !== 'fight_bar' || paused) return;
    reticleLockedRef.current = false;
    let dir = 1;
    let pos = 0.04;
    let last = performance.now();
    let animId = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reticleLockedRef.current) {
        pos += dir * dt * 1.45;
        if (pos >= 0.98) {
          pos = 0.98;
          dir = -1;
        } else if (pos <= 0.02) {
          pos = 0.02;
          dir = 1;
        }
        reticleRef.current = pos;
        setReticlePos(pos);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [phase, paused]);

  // Bullet-box 60 FPS survival loop during enemy_turn
  useEffect(() => {
    if (phase !== 'enemy_turn') return;
    const canvas = bulletCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let soulX = W / 2;
    let soulY = H / 2;
    const soulRadius = 6;
    let invulnTimer = 0.4;
    let elapsed = 0;
    const turnDuration = enemy.isBoss ? 5.6 : 4.6;
    let spawnAccum = 0;
    let nextId = 1;
    const bullets: BulletEntity[] = [];

    const spawnPattern = (pattern: BulletPatternType, time: number) => {
      if (pattern === 'spores') {
        // Gentle drifting spore orbs + diagonal leaf blades
        const fromLeft = Math.random() < 0.5;
        bullets.push({
          id: nextId++,
          x: fromLeft ? -8 : W + 8,
          y: 20 + Math.random() * (H - 40),
          vx: (fromLeft ? 1 : -1) * (58 + Math.random() * 35),
          vy: (Math.random() - 0.5) * 42,
          radius: 6,
          kind: 'orb',
          age: 0,
          maxAge: 5,
          damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
        });
        if (Math.random() < 0.35) {
          bullets.push({
            id: nextId++,
            x: 20 + Math.random() * (W - 40),
            y: -8,
            vx: (Math.random() - 0.5) * 30,
            vy: 82,
            radius: 5,
            kind: 'blade',
            age: 0,
            maxAge: 4,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        }
      } else if (pattern === 'prism_moths') {
        // Lantern orbs + telegraphed horizontal/vertical prism beams
        if (Math.random() < 0.28) {
          const horizontal = Math.random() < 0.5;
          bullets.push({
            id: nextId++,
            x: horizontal ? W / 2 : 30 + Math.random() * (W - 60),
            y: horizontal ? 30 + Math.random() * (H - 60) : H / 2,
            vx: 0,
            vy: 0,
            radius: 8,
            kind: 'beam_telegraph',
            age: 0,
            maxAge: 1.05,
            telegraphDuration: 0.52,
            width: horizontal ? W : 16,
            height: horizontal ? 16 : H,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        } else {
          const angle = Math.random() * Math.PI * 2;
          const dist = 120;
          bullets.push({
            id: nextId++,
            x: W / 2 + Math.cos(angle) * dist,
            y: H / 2 + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * 76,
            vy: -Math.sin(angle) * 76,
            radius: 6,
            kind: 'orb',
            age: 0,
            maxAge: 4,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        }
      } else {
        // Boss: Obsidian Trials (falling shards + telegraphed cross pillars + shockwaves)
        const roll = Math.random();
        if (roll < 0.28) {
          const laneX = 28 + Math.floor(Math.random() * 4) * ((W - 56) / 3);
          bullets.push({
            id: nextId++,
            x: laneX,
            y: H / 2,
            vx: 0,
            vy: 0,
            radius: 10,
            kind: 'beam_telegraph',
            age: 0,
            maxAge: 1.1,
            telegraphDuration: 0.55,
            width: 20,
            height: H,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        } else if (roll < 0.72) {
          bullets.push({
            id: nextId++,
            x: 18 + Math.random() * (W - 36),
            y: -10,
            vx: Math.sin(time * 2) * 28,
            vy: 96 + Math.random() * 28,
            radius: 6,
            kind: 'shard',
            age: 0,
            maxAge: 3.5,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        } else {
          const side = Math.random() < 0.5 ? -8 : W + 8;
          bullets.push({
            id: nextId++,
            x: side,
            y: 22 + Math.random() * (H - 44),
            vx: side < 0 ? 92 : -92,
            vy: 0,
            radius: 7,
            kind: 'ring',
            age: 0,
            maxAge: 3.5,
            damage: calculateEnemyDamageTaken(enemy.atk, statsRef.current.def),
          });
        }
      }
    };

    let last = performance.now();
    let animId = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!pausedRef.current) {
        elapsed += dt;
        if (invulnTimer > 0) invulnTimer = Math.max(0, invulnTimer - dt);

        // Move SOUL by keyboard or pointer drag target
        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
        if (keys.has('arrowright') || keys.has('d')) dx += 1;
        if (keys.has('arrowup') || keys.has('w')) dy -= 1;
        if (keys.has('arrowdown') || keys.has('s')) dy += 1;

        const soulSpeed = 148;
        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          soulX += (dx / len) * soulSpeed * dt;
          soulY += (dy / len) * soulSpeed * dt;
          pointerTargetRef.current = null;
        } else if (pointerTargetRef.current) {
          const pdx = pointerTargetRef.current.x - soulX;
          const pdy = pointerTargetRef.current.y - soulY;
          const dist = Math.hypot(pdx, pdy);
          if (dist > 3) {
            const step = Math.min(dist, soulSpeed * dt);
            soulX += (pdx / dist) * step;
            soulY += (pdy / dist) * step;
          }
        }

        const clamped = clampSoulPosition(soulX, soulY, soulRadius, W, H);
        soulX = clamped.x;
        soulY = clamped.y;

        // Spawn projectiles
        const spawnInterval = enemy.id === 'bramblekin' ? 0.34 : enemy.id === 'vespera' ? 0.28 : 0.24;
        spawnAccum += dt;
        while (spawnAccum >= spawnInterval && elapsed < turnDuration - 0.65) {
          spawnAccum -= spawnInterval;
          spawnPattern(enemy.pattern, elapsed);
        }

        // Update projectiles & check collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.age += dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.kind === 'beam_telegraph' && b.telegraphDuration && b.age >= b.telegraphDuration) {
            b.kind = 'beam_active';
            soundEngine.playTone(300, 0.08, 'sawtooth', 0.04, 160);
          }

          if (b.age >= b.maxAge) {
            bullets.splice(i, 1);
            continue;
          }

          if (invulnTimer <= 0 && checkBulletCollision(soulX, soulY, soulRadius, b)) {
            invulnTimer = 0.9;
            soundEngine.playPlayerHurt();
            setArenaShake(true);
            setTimeout(() => setArenaShake(false), 200);
            onPlayerDamaged(b.damage);
          }
        }
      }

      // Draw Arena
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // Draw bullets
      for (const b of bullets) {
        if (b.kind === 'beam_telegraph' && b.width && b.height) {
          ctx.save();
          ctx.strokeStyle = '#FFE135';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
          ctx.fillStyle = 'rgba(255, 225, 53, 0.12)';
          ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
          ctx.restore();
        } else if (b.kind === 'beam_active' && b.width && b.height) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
          ctx.fillStyle = '#67E8F9';
          ctx.fillRect(b.x - b.width / 2 + 2, b.y - b.height / 2 + 2, Math.max(2, b.width - 4), Math.max(2, b.height - 4));
        } else if (b.kind === 'blade' || b.kind === 'shard') {
          ctx.fillStyle = b.kind === 'shard' ? '#FF8C1A' : '#A3E635';
          ctx.beginPath();
          ctx.moveTo(b.x, b.y - b.radius - 2);
          ctx.lineTo(b.x + b.radius, b.y + b.radius);
          ctx.lineTo(b.x - b.radius, b.y + b.radius);
          ctx.closePath();
          ctx.fill();
        } else if (b.kind === 'ring') {
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Player SOUL (blink while invulnerable)
      const blinkVisible = invulnTimer <= 0 || Math.floor(invulnTimer * 14) % 2 === 0;
      if (blinkVisible) {
        drawSoulHeart(ctx, soulX, soulY, 2, '#FF2A3B', 1);
      }

      // Subtle survival timer bar at top edge of arena
      const pct = Math.max(0, 1 - elapsed / turnDuration);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(0, 0, Math.round(W * pct), 2);

      if (elapsed >= turnDuration) {
        // End enemy turn cleanly back to player menu
        const nextTurn = turnCount + 1;
        setTurnCount(nextTurn);
        setEnemyBubble(null);
        const ready = isEnemySpareable(enemy, mercyProgress, enemyHp);
        const linePool = ready
          ? [enemy.spareReadyLine]
          : enemyHp <= enemy.maxHp * 0.4
          ? enemy.lowHpLines
          : enemy.flavorLines;
        setBoxMessage(linePool[nextTurn % linePool.length]);
        setPhase('menu');
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, enemy, mercyProgress, enemyHp, turnCount, onPlayerDamaged]);

  // Actions
  const triggerStrike = () => {
    if (reticleLockedRef.current || phase !== 'fight_bar') return;
    reticleLockedRef.current = true;

    const { damage, isCrit } = calculateFightDamage(
      playerStats.atk,
      playerStats.tempAtkBoost,
      enemy.def,
      reticleRef.current
    );

    soundEngine.playSlash(isCrit);
    setDamagePopup({ text: isCrit ? `CRIT -${damage}` : `-${damage}`, isCrit });

    // Hitstop feel: 70ms freeze before damage flash & recoil
    window.setTimeout(() => {
      soundEngine.playEnemyHit();
      setEnemyFlash(true);
      setEnemyShake(true);
      const nextHp = Math.max(0, enemyHp - damage);
      setEnemyHp(nextHp);
      onTurnAdvance();

      window.setTimeout(() => {
        setEnemyFlash(false);
        setEnemyShake(false);
      }, 240);

      window.setTimeout(() => {
        setDamagePopup(null);
        if (nextHp <= 0) {
          setBattleOutcome('slain');
          setBoxMessage(enemy.slainText);
          setPhase('victory_outro');
        } else {
          const hurtLine = enemy.hurtLines[turnCount % enemy.hurtLines.length];
          setBoxMessage(hurtLine);
          setEnemyBubble(nextHp <= enemy.maxHp * 0.35 ? 'Ugh... not yet...' : 'Gah!');
          setPhase('player_result');
        }
      }, 420);
    }, 70);
  };

  const handleSelectAct = (act: ActOption) => {
    soundEngine.playConfirm();
    const nextMercy = mercyProgress + act.mercyGain;
    setMercyProgress(nextMercy);
    setBoxMessage(act.flavorResponse);
    setEnemyBubble(act.enemyBubble);
    onTurnAdvance();
    setPhase('player_result');
  };

  const handleSelectItem = (item: InventoryItem, idx: number) => {
    soundEngine.playHeal();
    onConsumeItem(idx);
    onPlayerHeal(item.healAmount, item.atkBoost);
    onTurnAdvance();
    setBoxMessage(
      `* You used ${item.name}! Recovered ${item.healAmount} HP${
        item.atkBoost ? ` and gained +${item.atkBoost} ATK!` : '.'
      }`
    );
    setPhase('player_result');
  };

  const handleSpare = () => {
    if (spareReady) {
      soundEngine.playSpare();
      setBattleOutcome('spared');
      setEnemyBubble('Thank you...');
      setBoxMessage(enemy.sparedText);
      setPhase('victory_outro');
    } else {
      soundEngine.playConfirm();
      onTurnAdvance();
      setBoxMessage(`* You offered mercy, but ${enemy.name} is not ready to stand down yet!`);
      setEnemyBubble('Not so fast.');
      setPhase('player_result');
    }
  };

  const handleFlee = () => {
    if (enemy.isBoss) {
      soundEngine.playCancel();
      setBoxMessage('* There is no fleeing from the Sanctum Gatekeeper!');
      setPhase('player_result');
      return;
    }
    soundEngine.playConfirm();
    setBattleOutcome('fled');
    setBoxMessage('* You slipped back into the shadows.');
    setPhase('victory_outro');
  };

  const openActionMenu = (cat: ActionCategory) => {
    soundEngine.playConfirm();
    setSubIndex(0);
    if (cat === 'FIGHT') setPhase('fight_bar');
    if (cat === 'ACT') setPhase('submenu_act');
    if (cat === 'ITEM') setPhase('submenu_item');
    if (cat === 'MERCY') setPhase('submenu_mercy');
  };

  // Global keyboard controls for combat menus & bullet arena
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      const k = e.key.toLowerCase();

      if (phase === 'enemy_turn') {
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
          e.preventDefault();
          keysRef.current.add(k);
        }
        return;
      }

      if (phase === 'fight_bar') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          triggerStrike();
        }
        return;
      }

      if (phase === 'player_result') {
        if (k === 'z' || k === 'enter' || k === ' ' || k === 'x') {
          e.preventDefault();
          soundEngine.playConfirm();
          setPhase('enemy_turn');
        }
        return;
      }

      if (phase === 'victory_outro') {
        if (k === 'z' || k === 'enter' || k === ' ') {
          e.preventDefault();
          soundEngine.playConfirm();
          if (battleOutcome) onCombatComplete(battleOutcome);
        }
        return;
      }

      if (phase === 'menu') {
        if (k === 'arrowleft' || k === 'a') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSelectedAction((prev) => (prev + 3) % 4);
        } else if (k === 'arrowright' || k === 'd') {
          e.preventDefault();
          soundEngine.playMenuMove();
          setSelectedAction((prev) => (prev + 1) % 4);
        } else if (k === 'z' || k === 'enter' || k === ' ') {
          if (performance.now() < inputReadyAtRef.current) return;
          e.preventDefault();
          openActionMenu(ACTION_LIST[selectedAction]);
        }
        return;
      }

      // Submenus (ACT, ITEM, MERCY)
      if (k === 'x' || k === 'shift') {
        e.preventDefault();
        soundEngine.playCancel();
        setPhase('menu');
        return;
      }

      const listLen =
        phase === 'submenu_act'
          ? enemy.acts.length
          : phase === 'submenu_item'
          ? inventory.length
          : 2;

      if (listLen === 0) return;

      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        soundEngine.playMenuMove();
        setSubIndex((prev) => (prev - 1 + listLen) % listLen);
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        soundEngine.playMenuMove();
        setSubIndex((prev) => (prev + 1) % listLen);
      } else if (k === 'z' || k === 'enter' || k === ' ') {
        e.preventDefault();
        if (phase === 'submenu_act') {
          handleSelectAct(enemy.acts[subIndex]);
        } else if (phase === 'submenu_item' && inventory[subIndex]) {
          handleSelectItem(inventory[subIndex], subIndex);
        } else if (phase === 'submenu_mercy') {
          if (subIndex === 0) handleSpare();
          else handleFlee();
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
  });

  const enemyHpPct = Math.max(0, Math.min(100, (enemyHp / enemy.maxHp) * 100));

  return (
    <section
      className={`flex flex-1 flex-col items-center justify-between bg-[#050508] px-4 py-4 sm:py-6 ${
        arenaShake ? 'translate-x-1 -translate-y-0.5' : ''
      }`}
      aria-label={`Combat with ${enemy.name}`}
    >
      {/* 1. Enemy Stage */}
      <div className="relative flex w-full max-w-[680px] flex-col items-center justify-center py-2">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-pixel-display text-sm tracking-wider text-white">
            {enemy.name}
          </span>
          <span className="font-pixel-body text-lg text-slate-400">
            {enemy.title}
          </span>
        </div>

        {/* Enemy HP Bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-36 border border-white/40 bg-[#2A1014]">
            <div
              className="h-full bg-[#39E65A] transition-all duration-200"
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
          <span className="font-pixel-num text-xs text-slate-300">
            {enemyHp}/{enemy.maxHp}
          </span>
          {spareReady && (
            <span className="font-pixel-display text-[11px] text-[#FFE135]">
              SPARE READY
            </span>
          )}
        </div>

        {/* Enemy Sprite + Floating Speech Bubble + Damage Popup */}
        <div className="relative flex min-h-[124px] items-center justify-center">
          <div
            className={`transition-transform duration-150 ${
              enemyShake ? 'translate-x-2' : ''
            }`}
          >
            <PixelSpriteCanvas
              spriteKey={enemy.id}
              pixelSize={7}
              flashWhite={enemyFlash}
              spared={battleOutcome === 'spared'}
              slain={battleOutcome === 'slain'}
            />
          </div>

          {enemyBubble && (
            <div className="absolute -right-4 top-0 max-w-[190px] translate-x-full border-2 border-white bg-white px-3 py-1.5 font-pixel-body text-lg leading-tight text-black shadow-md hidden sm:block">
              {enemyBubble}
            </div>
          )}

          {damagePopup && (
            <div
              className={`absolute -top-3 font-pixel-display text-xl font-bold drop-shadow-[0_2px_0_#000] ${
                damagePopup.isCrit ? 'text-[#FFE135]' : 'text-[#FF2A3B]'
              }`}
            >
              {damagePopup.text}
            </div>
          )}
        </div>
        {enemyBubble && (
          <div className="mt-2 border-2 border-white bg-white px-3 py-1 font-pixel-body text-lg leading-tight text-black sm:hidden">
            {enemyBubble}
          </div>
        )}
      </div>

      {/* 2. Center Battle / Bullet Box */}
      <div className="flex w-full max-w-[680px] flex-1 items-center justify-center my-2">
        {phase === 'enemy_turn' ? (
          <div className="ut-box relative flex flex-col items-center p-1">
            <canvas
              ref={bulletCanvasRef}
              width={256}
              height={208}
              data-testid="bullet-arena-canvas"
              className="pixelated block cursor-crosshair bg-black touch-none"
              onPointerMove={(e) => {
                if (e.buttons === 1 || e.pointerType === 'touch') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  pointerTargetRef.current = {
                    x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
                    y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
                  };
                }
              }}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                pointerTargetRef.current = {
                  x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
                  y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
                };
              }}
            />
            <span className="mt-1 font-pixel-body text-base text-slate-400">
              Dodge with Arrow Keys / WASD or Drag
            </span>
          </div>
        ) : (
          <div className="ut-box flex min-h-[196px] w-full flex-col justify-between p-4 sm:p-5">
            {phase === 'menu' && (
              <p className="font-pixel-body text-2xl leading-relaxed text-white">
                {boxMessage.slice(0, typedChars)}
              </p>
            )}

            {phase === 'fight_bar' && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <p className="font-pixel-display text-xs tracking-wider text-slate-300">
                  STRIKE NEAR THE CENTER! [Z / ENTER / CLICK]
                </p>
                <div className="relative h-16 w-full max-w-[460px] border-2 border-white/60 bg-[#0A0A10]">
                  {/* Center sweet-spot zone */}
                  <div className="absolute inset-y-0 left-[43%] w-[14%] bg-[#FFE135]/20 border-x border-[#FFE135]/60" />
                  <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[#FFE135]" />
                  {/* Moving strike bar */}
                  <div
                    className="absolute inset-y-1 w-2.5 -translate-x-1/2 bg-white shadow-[0_0_8px_#fff]"
                    style={{ left: `${reticlePos * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={triggerStrike}
                  className="ut-btn font-pixel-display cursor-pointer px-6 py-2 text-xs tracking-wider"
                >
                  STRIKE NOW
                </button>
              </div>
            )}

            {phase === 'submenu_act' && (
              <div className="flex flex-1 flex-col justify-between">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {enemy.acts.map((act, idx) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleSelectAct(act)}
                      onMouseEnter={() => setSubIndex(idx)}
                      className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-left transition-colors ${
                        subIndex === idx
                          ? 'border-[#FFE135] bg-white/10 text-[#FFE135]'
                          : 'border-white/20 text-white hover:border-white/60'
                      }`}
                    >
                      <span className="font-pixel-display text-xs text-[#FF2A3B]">
                        {subIndex === idx ? '♥' : ' '}
                      </span>
                      <div>
                        <div className="font-pixel-display text-xs">{act.label}</div>
                        <div className="font-pixel-body text-base text-slate-400">
                          {act.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCancel();
                      setPhase('menu');
                    }}
                    className="cursor-pointer font-pixel-display text-xs text-slate-400 hover:text-white"
                  >
                    Back [X]
                  </button>
                </div>
              </div>
            )}

            {phase === 'submenu_item' && (
              <div className="flex flex-1 flex-col justify-between">
                {inventory.length === 0 ? (
                  <p className="font-pixel-body text-2xl text-slate-400">
                    * Your pack is empty.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {inventory.map((item, idx) => (
                      <button
                        key={`${item.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectItem(item, idx)}
                        onMouseEnter={() => setSubIndex(idx)}
                        className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-left transition-colors ${
                          subIndex === idx
                            ? 'border-[#FFE135] bg-white/10 text-[#FFE135]'
                            : 'border-white/20 text-white hover:border-white/60'
                        }`}
                      >
                        <span className="font-pixel-display text-xs text-[#FF2A3B]">
                          {subIndex === idx ? '♥' : ' '}
                        </span>
                        <div>
                          <div className="font-pixel-display text-xs">{item.name}</div>
                          <div className="font-pixel-body text-base text-slate-400">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCancel();
                      setPhase('menu');
                    }}
                    className="cursor-pointer font-pixel-display text-xs text-slate-400 hover:text-white"
                  >
                    Back [X]
                  </button>
                </div>
              </div>
            )}

            {phase === 'submenu_mercy' && (
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSpare}
                    onMouseEnter={() => setSubIndex(0)}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-2.5 text-left transition-colors ${
                      subIndex === 0 ? 'border-[#FFE135] bg-white/10' : 'border-white/25'
                    }`}
                  >
                    <span className="font-pixel-display text-xs text-[#FF2A3B]">
                      {subIndex === 0 ? '♥' : ' '}
                    </span>
                    <span
                      className={`font-pixel-display text-sm ${
                        spareReady ? 'text-[#FFE135]' : 'text-white'
                      }`}
                    >
                      * Spare {enemy.name}
                    </span>
                    {spareReady && (
                      <span className="ml-auto font-pixel-body text-lg text-[#FFE135]">
                        (Ready!)
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleFlee}
                    onMouseEnter={() => setSubIndex(1)}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-2.5 text-left transition-colors ${
                      subIndex === 1 ? 'border-[#FFE135] bg-white/10' : 'border-white/25'
                    }`}
                  >
                    <span className="font-pixel-display text-xs text-[#FF2A3B]">
                      {subIndex === 1 ? '♥' : ' '}
                    </span>
                    <span className="font-pixel-display text-sm text-slate-200">
                      * Flee
                    </span>
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCancel();
                      setPhase('menu');
                    }}
                    className="cursor-pointer font-pixel-display text-xs text-slate-400 hover:text-white"
                  >
                    Back [X]
                  </button>
                </div>
              </div>
            )}

            {(phase === 'player_result' || phase === 'victory_outro') && (
              <div className="flex flex-1 flex-col justify-between gap-3">
                <p className="font-pixel-body text-2xl leading-relaxed text-white">
                  {boxMessage.slice(0, typedChars)}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playConfirm();
                      if (phase === 'victory_outro' && battleOutcome) {
                        onCombatComplete(battleOutcome);
                      } else {
                        setPhase('enemy_turn');
                      }
                    }}
                    className="ut-btn font-pixel-display cursor-pointer px-4 py-2 text-xs tracking-wider"
                  >
                    {phase === 'victory_outro' ? 'Continue Journey ▶' : 'Brace for Attack ▶'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Undertale Action Bar (FIGHT / ACT / ITEM / MERCY) */}
      <div className="grid w-full max-w-[680px] grid-cols-4 gap-2 sm:gap-4">
        {ACTION_LIST.map((action, idx) => {
          const active = phase === 'menu' && selectedAction === idx;
          const highlightSpare = action === 'MERCY' && spareReady;
          return (
            <button
              key={action}
              type="button"
              disabled={phase !== 'menu' && phase !== 'submenu_act' && phase !== 'submenu_item' && phase !== 'submenu_mercy'}
              data-active={active}
              onClick={() => {
                setSelectedAction(idx);
                openActionMenu(action);
              }}
              onMouseEnter={() => setSelectedAction(idx)}
              className={`ut-btn flex cursor-pointer items-center justify-center gap-2 py-2.5 px-2 font-pixel-display text-xs sm:text-sm tracking-wider disabled:opacity-45 disabled:cursor-not-allowed ${
                highlightSpare ? 'border-[#FFE135] text-[#FFE135]' : ''
              }`}
            >
              <span className="text-[#FF2A3B]" aria-hidden="true">
                {active ? '♥' : ''}
              </span>
              <span>{action}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
