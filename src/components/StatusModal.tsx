import type { RunOutcome } from '../game/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface PauseModalProps {
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onToggleMute: () => void;
}

export function PauseModal({
  muted,
  onResume,
  onRestart,
  onReturnTitle,
  onToggleMute,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
    >
      <div className="ut-box flex w-full max-w-md flex-col items-center gap-5 p-6 text-center">
        <h2 className="font-pixel-display text-xl tracking-widest text-white">PAUSED</h2>
        <p className="font-pixel-body text-xl text-slate-300">
          Take a breath in the quiet dark.
        </p>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="ut-btn font-pixel-display cursor-pointer w-full py-2.5 text-sm tracking-wider"
          >
            Resume [Esc]
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="cursor-pointer border-2 border-white/50 bg-black py-2.5 font-pixel-display text-xs tracking-wider text-white hover:border-white"
          >
            Audio: {muted ? 'Muted' : 'Enabled'} [M]
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="cursor-pointer border-2 border-white/50 bg-black py-2.5 font-pixel-display text-xs tracking-wider text-white hover:border-white"
          >
            Restart Run
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="cursor-pointer border-2 border-slate-600 bg-black py-2.5 font-pixel-display text-xs tracking-wider text-slate-300 hover:border-white hover:text-white"
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}

interface OutcomeModalProps {
  outcome: RunOutcome;
  onRetryCheckpoint?: () => void;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export function OutcomeModal({
  outcome,
  onRetryCheckpoint,
  onPlayAgain,
  onReturnTitle,
}: OutcomeModalProps) {
  const isDefeat = outcome.ending === 'defeat';
  const accentColor =
    outcome.ending === 'pacifist'
      ? 'text-[#FFE135]'
      : outcome.ending === 'ruthless'
      ? 'text-[#FF2A3B]'
      : outcome.ending === 'neutral'
      ? 'text-[#67E8F9]'
      : 'text-[#FF2A3B]';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#050508]/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={outcome.title}
    >
      <div className="ut-box flex w-full max-w-xl flex-col items-center gap-5 p-6 sm:p-8 text-center">
        <PixelSpriteCanvas
          spriteKey="soul"
          pixelSize={5}
          slain={isDefeat}
        />

        <h2 className={`font-pixel-display text-xl sm:text-2xl tracking-wider ${accentColor}`}>
          {outcome.title}
        </h2>

        <div className="flex flex-col gap-3 text-left">
          {outcome.epilogue.map((para, idx) => (
            <p key={idx} className="font-pixel-body text-xl leading-snug text-slate-200">
              {para}
            </p>
          ))}
        </div>

        {/* Mastery / Progress Metrics */}
        <div className="grid w-full grid-cols-3 gap-3 border-y border-white/20 py-3">
          <div>
            <div className="font-pixel-display text-[10px] text-slate-400">SOUL LV</div>
            <div className="font-pixel-num text-lg font-bold text-white">
              LV {outcome.stats.lv}
            </div>
          </div>
          <div>
            <div className="font-pixel-display text-[10px] text-slate-400">SPARED / SLAIN</div>
            <div className="font-pixel-num text-lg font-bold text-[#FFE135]">
              {outcome.stats.sparedCount} / {outcome.stats.slainCount}
            </div>
          </div>
          <div>
            <div className="font-pixel-display text-[10px] text-slate-400">
              {isDefeat ? 'ZONE REACHED' : 'GOLD'}
            </div>
            <div className="font-pixel-num text-lg font-bold text-white">
              {isDefeat ? outcome.stats.zoneReached : `${outcome.stats.gold}G`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isDefeat && onRetryCheckpoint && (
            <button
              type="button"
              data-start="true"
              onClick={onRetryCheckpoint}
              className="ut-btn font-pixel-display cursor-pointer px-6 py-3 text-xs tracking-wider"
            >
              Try Again from Anchor
            </button>
          )}
          <button
            type="button"
            data-start={!isDefeat ? 'true' : undefined}
            onClick={onPlayAgain}
            className={`${
              !isDefeat ? 'ut-btn' : 'border-2 border-white/60 bg-black text-white hover:border-white'
            } font-pixel-display cursor-pointer px-6 py-3 text-xs tracking-wider`}
          >
            {isDefeat ? 'New Journey' : 'Play Again'}
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="cursor-pointer border-2 border-slate-600 bg-black px-5 py-3 font-pixel-display text-xs tracking-wider text-slate-300 hover:border-white hover:text-white"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
}
