import type { PlayerStats } from '../game/types';

interface GameHudHeaderProps {
  stats: PlayerStats;
  zoneTitle: string;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
}

export function GameHudHeader({
  stats,
  zoneTitle,
  muted,
  onToggleMute,
  onPause,
  onRestart,
}: GameHudHeaderProps) {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));

  return (
    <header
      className="pointer-events-auto flex w-full items-center justify-between gap-4 border-b-2 border-white/25 bg-[#050508] px-4 py-2.5 sm:px-6"
      aria-label="Player status"
    >
      {/* Left: Character Stats (Undertale style compact strip) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="font-pixel-display text-sm tracking-wider text-white whitespace-nowrap">
          {stats.name}
        </span>

        <span className="font-pixel-display text-sm text-slate-200 whitespace-nowrap font-pixel-num">
          LV {stats.lv}
        </span>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-pixel-display text-xs text-[#FFE135]">HP</span>
          <div
            className="h-3.5 w-24 border border-white/40 bg-[#D92B2B] sm:w-28"
            role="progressbar"
            aria-valuenow={stats.hp}
            aria-valuemin={0}
            aria-valuemax={stats.maxHp}
            aria-label="Hit Points"
          >
            <div
              className="h-full bg-[#FFE135] transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <span className="font-pixel-num text-sm font-bold text-white">
            {stats.hp} / {stats.maxHp}
          </span>
        </div>

        <span className="font-pixel-num text-sm font-bold text-[#FFE135] whitespace-nowrap">
          {stats.gold}G
        </span>

        <span className="hidden md:inline font-pixel-body text-lg text-slate-300 whitespace-nowrap">
          {zoneTitle}
        </span>
      </div>

      {/* Right: Compact square <svg> utility buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          title={muted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-white/60 bg-black text-white transition-colors hover:border-[#FFE135] hover:text-[#FFE135]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            {muted ? (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3l3.5 3.5-1.5 1.5L15 13.5 11.5 17 10 15.5 13.5 12 10 8.5 11.5 7 15 10.5 18.5 7 20 8.5 16.5 12z" />
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          title="Pause (Esc / P)"
          aria-label="Pause game"
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-white/60 bg-black text-white transition-colors hover:border-[#FFE135] hover:text-[#FFE135]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onRestart();
          }}
          title="Restart Run (R)"
          aria-label="Restart run"
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-white/60 bg-black text-white transition-colors hover:border-[#FFE135] hover:text-[#FFE135]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
