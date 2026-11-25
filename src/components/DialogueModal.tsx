import { useEffect, useState } from 'react';
import { soundEngine } from '../game/soundEngine';
import type { ActiveDialogue, DialogueChoice } from '../game/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface DialogueModalProps {
  dialogue: ActiveDialogue;
  onAdvance: () => void;
  onChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export function DialogueModal({
  dialogue,
  onAdvance,
  onChoice,
  onClose,
}: DialogueModalProps) {
  const currentLine = dialogue.lines[dialogue.index];
  const [charCount, setCharCount] = useState(0);

  const fullText = currentLine?.text ?? '';
  const isComplete = charCount >= fullText.length;

  useEffect(() => {
    setCharCount(0);
  }, [dialogue.index, fullText]);

  useEffect(() => {
    if (charCount >= fullText.length) return;
    const timer = window.setTimeout(() => {
      const next = charCount + 1;
      setCharCount(next);
      const ch = fullText[next - 1];
      if (ch && ch !== ' ') {
        soundEngine.playTextBlip(currentLine.speaker === 'Warden Malakor' ? 210 : 420);
      }
    }, 20);
    return () => window.clearTimeout(timer);
  }, [charCount, fullText, currentLine?.speaker]);

  const handleConfirm = () => {
    if (!isComplete) {
      setCharCount(fullText.length);
      return;
    }
    if (currentLine.choices && currentLine.choices.length > 0) {
      return;
    }
    soundEngine.playConfirm();
    onAdvance();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'x' || k === 'shift') {
        e.preventDefault();
        if (!isComplete) {
          setCharCount(fullText.length);
        } else if (!currentLine.choices?.length) {
          onAdvance();
        } else {
          onClose();
        }
        return;
      }

      if (k === 'z' || k === 'enter' || k === ' ') {
        if (currentLine.choices && currentLine.choices.length > 0 && isComplete) {
          return;
        }
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!currentLine) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-5 z-30 mx-auto w-[92%] max-w-[680px]"
      role="dialog"
      aria-label={`Dialogue with ${currentLine.speaker}`}
    >
      <div className="ut-box flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {currentLine.portraitKey && (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-white/40 bg-[#0A0A12]">
              <PixelSpriteCanvas spriteKey={currentLine.portraitKey} pixelSize={4} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1 font-pixel-display text-xs tracking-wider text-[#FFE135]">
              {currentLine.speaker}
            </div>
            <p className="min-h-[3.5rem] font-pixel-body text-2xl leading-snug text-white">
              {fullText.slice(0, charCount)}
            </p>
          </div>
        </div>

        {isComplete && currentLine.choices && currentLine.choices.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/20 pt-3">
            {currentLine.choices.map((choice, idx) => (
              <button
                key={choice.label}
                type="button"
                autoFocus={idx === 0}
                onClick={() => {
                  soundEngine.playConfirm();
                  onChoice(choice);
                }}
                className="ut-btn font-pixel-display cursor-pointer px-4 py-2 text-xs tracking-wider whitespace-nowrap"
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleConfirm}
              className="cursor-pointer font-pixel-display text-xs tracking-wider text-[#FFE135] hover:underline whitespace-nowrap"
            >
              {isComplete ? 'Continue [Z / Enter] ▶' : 'Skip [X]'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
