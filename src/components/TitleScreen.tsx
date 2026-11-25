import { useEffect, useRef } from 'react';
import { drawSoulHeart } from '../game/pixelSprites';

interface TitleScreenProps {
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
}

export function TitleScreen({ hasSave, onStartNew, onContinue }: TitleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const spores = Array.from({ length: 36 }, (_, i) => ({
      x: ((i * 73) % 480),
      y: ((i * 47) % 270),
      speed: 8 + (i % 5) * 4,
      size: i % 3 === 0 ? 3 : 2,
      drift: (i % 7) - 3,
      color: i % 4 === 0 ? '#FFE135' : i % 3 === 0 ? '#67E8F9' : '#A78BFA',
    }));

    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle subterranean ruin silhouettes (negative space in center/upper half)
      ctx.fillStyle = '#0D0B14';
      ctx.fillRect(0, 210, 480, 60);
      ctx.fillRect(24, 130, 32, 85);
      ctx.fillRect(424, 118, 36, 97);
      ctx.fillRect(68, 170, 22, 42);
      ctx.fillRect(390, 162, 24, 50);

      // Faint horizon line
      ctx.fillStyle = '#1E1B2E';
      ctx.fillRect(0, 210, 480, 2);

      // Floating glowing spores
      for (const s of spores) {
        s.y -= s.speed * dt;
        s.x += Math.sin(t + s.drift) * 6 * dt;
        if (s.y < -4) {
          s.y = 274;
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 2 + s.drift);
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
      }
      ctx.globalAlpha = 1;

      // Centerpiece floating Crimson SOUL Heart in clear space above CTA
      const bobY = Math.round(Math.sin(t * 2.2) * 3);
      ctx.fillStyle = 'rgba(255, 42, 59, 0.14)';
      ctx.fillRect(222, 130 + bobY, 36, 32);
      drawSoulHeart(ctx, 240, 146 + bobY, 4, '#FF2A3B', 1);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasSave) {
          onContinue();
        } else {
          onStartNew();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasSave, onContinue, onStartNew]);

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#050508]">
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="pixelated pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* Bespoke inline SVG pixel emblem & title lockup */}
        <div className="mb-4 flex flex-col items-center">
          <svg
            viewBox="0 0 360 74"
            className="w-[320px] sm:w-[440px] max-w-full drop-shadow-[0_4px_0_#000]"
            role="img"
            aria-label="Hollowcrest"
          >
            {/* Pixel border crest marks */}
            <rect x="16" y="10" width="8" height="8" fill="#FFE135" />
            <rect x="336" y="10" width="8" height="8" fill="#FFE135" />
            <rect x="32" y="13" width="44" height="2" fill="#475569" />
            <rect x="284" y="13" width="44" height="2" fill="#475569" />
            <text
              x="180"
              y="46"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Silkscreen, monospace"
              fontSize="30"
              fontWeight="700"
              letterSpacing="4"
            >
              HOLLOWCREST
            </text>
            <rect x="64" y="58" width="232" height="2" fill="#FFFFFF" opacity="0.28" />
          </svg>
          <p className="mt-2 font-pixel-body text-xl tracking-wide text-slate-300">
            A subterranean tale of mercy, resolve, and consequence.
          </p>
        </div>

        {/* Dedicated clear window for centerpiece SOUL heart */}
        <div className="h-28 sm:h-32" aria-hidden="true" />

        {/* Primary Menu Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasSave ? (
            <>
              <button
                type="button"
                data-start="true"
                onClick={onContinue}
                className="ut-btn font-pixel-display cursor-pointer px-7 py-3 text-base tracking-wider whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE135]"
              >
                Continue Journey
              </button>
              <button
                type="button"
                onClick={onStartNew}
                className="font-pixel-display cursor-pointer border-2 border-slate-500 bg-black px-6 py-3 text-sm tracking-wider text-slate-200 transition-colors hover:border-white hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Reset &amp; New Run
              </button>
            </>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onStartNew}
              className="ut-btn font-pixel-display cursor-pointer px-8 py-3.5 text-base tracking-wider whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE135]"
            >
              Begin Journey
            </button>
          )}
        </div>
      </div>

      {/* Single flat borderless control hint in bottom safe margin */}
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 px-4 text-center font-pixel-body text-lg tracking-wide text-slate-400">
        Arrow Keys / WASD Move · Z / Enter Confirm · X / Shift Back · Esc Pause
      </p>
    </main>
  );
}
