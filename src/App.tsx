import { useCallback, useEffect, useState } from 'react';
import { CombatArena } from './components/CombatArena';
import { DialogueModal } from './components/DialogueModal';
import { GameHudHeader } from './components/GameHudHeader';
import { OverworldCanvas } from './components/OverworldCanvas';
import { OutcomeModal, PauseModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import {
  INITIAL_PLAYER_STATS,
  TILE_SIZE,
  applyExpGain,
  determineEnding,
} from './game/combatEngine';
import {
  ENEMIES,
  INITIAL_INVENTORY,
  ROOMS,
  buildEndingOutcome,
  getBranchingDialogue,
} from './game/narrativeData';
import { soundEngine } from './game/soundEngine';
import type {
  ActiveDialogue,
  DialogueChoice,
  Direction,
  EnemyId,
  GameShellState,
  InteractableEntity,
  InventoryItem,
  PlayMode,
  PlayerStats,
  PortalZone,
  RunOutcome,
  WorldProgress,
} from './game/types';

const SAVE_STORAGE_KEY = 'hollowcrest_save_v1';

interface SavedSnapshot {
  stats: PlayerStats;
  inventory: InventoryItem[];
  progress: WorldProgress;
}

function createInitialProgress(): WorldProgress {
  return {
    room: 'mossy_threshold',
    playerX: 4.5 * TILE_SIZE,
    playerY: 5.5 * TILE_SIZE,
    playerDir: 'right',
    sparedEnemies: [],
    slainEnemies: [],
    collectedItems: [],
    turnsTaken: 0,
    damageTaken: 0,
  };
}

function loadSavedSnapshot(): SavedSnapshot | null {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSnapshot;
    if (parsed && parsed.stats && parsed.progress && Array.isArray(parsed.inventory)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(() =>
    loadSavedSnapshot()
  );
  const [shellState, setShellState] = useState<GameShellState>(
    autostart ? 'playing' : 'title'
  );
  const [playMode, setPlayMode] = useState<PlayMode>('overworld');
  const [muted, setMuted] = useState<boolean>(false);

  const [stats, setStats] = useState<PlayerStats>(INITIAL_PLAYER_STATS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [progress, setProgress] = useState<WorldProgress>(createInitialProgress);

  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null);
  const [activeEnemyId, setActiveEnemyId] = useState<EnemyId | null>(null);
  const [runOutcome, setRunOutcome] = useState<RunOutcome | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Sync document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
    window.setTimeout(() => {
      setToastNotice((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  const persistSave = useCallback(
    (nextStats: PlayerStats, nextInv: InventoryItem[], nextProg: WorldProgress) => {
      const snapshot: SavedSnapshot = {
        stats: nextStats,
        inventory: nextInv,
        progress: nextProg,
      };
      try {
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(snapshot));
        setSavedSnapshot(snapshot);
      } catch {
        // Ignore storage quota errors
      }
    },
    []
  );

  const startFreshRun = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.playConfirm();
    setStats(INITIAL_PLAYER_STATS);
    setInventory(INITIAL_INVENTORY);
    setProgress(createInitialProgress());
    setActiveDialogue(null);
    setActiveEnemyId(null);
    setRunOutcome(null);
    setPlayMode('overworld');
    setShellState('playing');
  }, []);

  const continueSavedRun = useCallback(() => {
    const snap = loadSavedSnapshot();
    if (!snap) {
      startFreshRun();
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.playConfirm();
    setStats(snap.stats);
    setInventory(snap.inventory);
    setProgress(snap.progress);
    setActiveDialogue(null);
    setActiveEnemyId(null);
    setRunOutcome(null);
    setPlayMode('overworld');
    setShellState('playing');
  }, [startFreshRun]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Global utility shortcuts (Esc / P to pause, M to mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'm') {
        toggleMute();
        return;
      }

      if (e.key === 'Escape' || (k === 'p' && shellState !== 'title')) {
        if (shellState === 'playing') {
          e.preventDefault();
          setShellState('paused');
        } else if (shellState === 'paused') {
          e.preventDefault();
          setShellState('playing');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState, toggleMute]);

  const handleMoveUpdate = useCallback((x: number, y: number, dir: Direction) => {
    setProgress((prev) => ({
      ...prev,
      playerX: x,
      playerY: y,
      playerDir: dir,
    }));
  }, []);

  const triggerEnding = useCallback(
    (prog: WorldProgress, st: PlayerStats) => {
      const ending = determineEnding(prog);
      soundEngine.playSpare();
      setRunOutcome(
        buildEndingOutcome(ending, prog, st.lv, st.hp, st.maxHp, st.gold)
      );
      setPlayMode('overworld');
      setShellState('gameover');
    },
    []
  );

  const handlePortalEnter = useCallback(
    (portal: PortalZone) => {
      if (portal.requiresBossResolved) {
        const bossResolved =
          progress.sparedEnemies.includes('malakor') ||
          progress.slainEnemies.includes('malakor');
        if (!bossResolved) {
          soundEngine.playCancel();
          setActiveDialogue({
            sourceId: 'gate_locked',
            lines: [
              {
                speaker: 'Surface Gate',
                text: '* Ancient iron seals hold fast. Warden Malakor guards the passage.',
              },
            ],
            index: 0,
          });
          setPlayMode('dialogue');
          return;
        }
        triggerEnding(progress, stats);
        return;
      }

      soundEngine.playMenuMove();
      setProgress((prev) => ({
        ...prev,
        room: portal.targetRoom,
        playerX: (portal.spawnX + 0.5) * TILE_SIZE,
        playerY: (portal.spawnY + 0.5) * TILE_SIZE,
        playerDir: portal.spawnDir,
      }));
    },
    [progress, stats, triggerEnding]
  );

  const handleInteract = useCallback(
    (entity: InteractableEntity) => {
      soundEngine.playConfirm();
      const script = getBranchingDialogue(entity.id, progress, stats.lv);
      setActiveDialogue({
        sourceId: entity.id,
        lines: script.lines,
        index: 0,
        onCompleteAction: script.onCompleteAction,
        enemyId: script.enemyId,
        itemReward: script.itemReward,
      });
      setPlayMode('dialogue');
    },
    [progress, stats.lv]
  );

  const executeDialogueAction = useCallback(
    (
      action: 'start_combat' | 'heal_save' | 'take_item' | 'trigger_ending' | undefined,
      dialogue: ActiveDialogue
    ) => {
      setActiveDialogue(null);
      if (action === 'start_combat' && dialogue.enemyId) {
        setActiveEnemyId(dialogue.enemyId);
        setPlayMode('combat');
        return;
      }

      if (action === 'heal_save') {
        soundEngine.playSaveStar();
        const healedStats: PlayerStats = { ...stats, hp: stats.maxHp, tempAtkBoost: 0 };
        setStats(healedStats);
        persistSave(healedStats, inventory, progress);
        showToast('HP restored · Progress anchored');
        setPlayMode('overworld');
        return;
      }

      if (action === 'take_item' && dialogue.itemReward) {
        soundEngine.playHeal();
        const nextInv = [...inventory, dialogue.itemReward];
        const nextProg: WorldProgress = {
          ...progress,
          collectedItems: [...progress.collectedItems, dialogue.sourceId],
        };
        setInventory(nextInv);
        setProgress(nextProg);
        showToast(`Obtained ${dialogue.itemReward.name}`);
        setPlayMode('overworld');
        return;
      }

      if (action === 'trigger_ending') {
        triggerEnding(progress, stats);
        return;
      }

      setPlayMode('overworld');
    },
    [stats, inventory, progress, persistSave, showToast, triggerEnding]
  );

  const handleAdvanceDialogue = useCallback(() => {
    if (!activeDialogue) return;
    const nextIdx = activeDialogue.index + 1;
    if (nextIdx < activeDialogue.lines.length) {
      setActiveDialogue({ ...activeDialogue, index: nextIdx });
    } else {
      executeDialogueAction(activeDialogue.onCompleteAction, activeDialogue);
    }
  }, [activeDialogue, executeDialogueAction]);

  const handleDialogueChoice = useCallback(
    (choice: DialogueChoice) => {
      if (!activeDialogue) return;
      if (choice.action === 'close') {
        setActiveDialogue(null);
        setPlayMode('overworld');
        return;
      }
      if (choice.action === 'next') {
        handleAdvanceDialogue();
        return;
      }
      executeDialogueAction(choice.action, activeDialogue);
    },
    [activeDialogue, handleAdvanceDialogue, executeDialogueAction]
  );

  // Combat callbacks
  const handlePlayerDamaged = useCallback(
    (amount: number) => {
      setProgress((prev) => ({
        ...prev,
        damageTaken: prev.damageTaken + amount,
      }));
      setStats((prev) => {
        const nextHp = Math.max(0, prev.hp - amount);
        if (nextHp <= 0) {
          soundEngine.playDefeatShatter();
          const finalStats = { ...prev, hp: 0 };
          setRunOutcome(
            buildEndingOutcome(
              'defeat',
              progress,
              prev.lv,
              0,
              prev.maxHp,
              prev.gold
            )
          );
          setActiveEnemyId(null);
          setPlayMode('overworld');
          setShellState('gameover');
          return finalStats;
        }
        return { ...prev, hp: nextHp };
      });
    },
    [progress]
  );

  const handlePlayerHeal = useCallback((amount: number, atkBoost?: number) => {
    setStats((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + amount),
      tempAtkBoost: prev.tempAtkBoost + (atkBoost ?? 0),
    }));
  }, []);

  const handleConsumeItem = useCallback((index: number) => {
    setInventory((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleTurnAdvance = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      turnsTaken: prev.turnsTaken + 1,
    }));
  }, []);

  const handleCombatComplete = useCallback(
    (outcome: 'spared' | 'slain' | 'fled') => {
      if (!activeEnemyId) return;
      const enemy = ENEMIES[activeEnemyId];

      let nextStats = { ...stats, tempAtkBoost: 0 };
      let nextProg = { ...progress };

      if (outcome === 'spared') {
        nextStats = applyExpGain(nextStats, 0, enemy.goldReward);
        if (!nextProg.sparedEnemies.includes(activeEnemyId)) {
          nextProg = {
            ...nextProg,
            sparedEnemies: [...nextProg.sparedEnemies, activeEnemyId],
          };
        }
        showToast(`${enemy.name} spared · +${enemy.goldReward}G`);
      } else if (outcome === 'slain') {
        nextStats = applyExpGain(nextStats, enemy.expReward, enemy.goldReward);
        if (!nextProg.slainEnemies.includes(activeEnemyId)) {
          nextProg = {
            ...nextProg,
            slainEnemies: [...nextProg.slainEnemies, activeEnemyId],
          };
        }
        showToast(`Defeated ${enemy.name} · +${enemy.expReward} EXP`);
      }

      setStats(nextStats);
      setProgress(nextProg);
      setActiveEnemyId(null);

      // Post-boss branching resolution prompt
      if (activeEnemyId === 'malakor' && outcome !== 'fled') {
        setActiveDialogue({
          sourceId: 'malakor_aftermath',
          onCompleteAction: 'trigger_ending',
          lines: [
            {
              speaker: outcome === 'spared' ? 'Warden Malakor' : 'Fractured Sanctum',
              portraitKey: outcome === 'spared' ? 'malakor' : undefined,
              text:
                outcome === 'spared'
                  ? '* The great obsidian seal lifts into the morning light. Step forward whenever you are ready.'
                  : '* The heavy seal collapses behind the silent throne. The Surface Gate stands open.',
              choices: [
                { label: 'Step into the Dawn', action: 'trigger_ending' },
                { label: 'Stay in Sanctum', action: 'close' },
              ],
            },
          ],
          index: 0,
        });
        setPlayMode('dialogue');
        return;
      }

      setPlayMode('overworld');
    },
    [activeEnemyId, stats, progress, showToast]
  );

  const currentZone = ROOMS[progress.room];

  return (
    <div className="flex h-full w-full flex-col bg-[#050508] text-white">
      {shellState === 'title' ? (
        <TitleScreen
          hasSave={savedSnapshot !== null}
          onStartNew={startFreshRun}
          onContinue={continueSavedRun}
        />
      ) : (
        <>
          <GameHudHeader
            stats={stats}
            zoneTitle={currentZone.title}
            muted={muted}
            onToggleMute={toggleMute}
            onPause={() =>
              setShellState((prev) => (prev === 'paused' ? 'playing' : 'paused'))
            }
            onRestart={startFreshRun}
          />

          <main className="relative flex flex-1 flex-col overflow-hidden">
            {playMode === 'combat' && activeEnemyId ? (
              <CombatArena
                enemy={ENEMIES[activeEnemyId]}
                playerStats={stats}
                inventory={inventory}
                paused={shellState === 'paused'}
                onPlayerDamaged={handlePlayerDamaged}
                onPlayerHeal={handlePlayerHeal}
                onConsumeItem={handleConsumeItem}
                onTurnAdvance={handleTurnAdvance}
                onCombatComplete={handleCombatComplete}
              />
            ) : (
              <OverworldCanvas
                progress={progress}
                paused={shellState !== 'playing'}
                dialogueOpen={playMode === 'dialogue'}
                onMoveUpdate={handleMoveUpdate}
                onPortalEnter={handlePortalEnter}
                onInteract={handleInteract}
              />
            )}

            {playMode === 'dialogue' && activeDialogue && (
              <DialogueModal
                dialogue={activeDialogue}
                onAdvance={handleAdvanceDialogue}
                onChoice={handleDialogueChoice}
                onClose={() => {
                  setActiveDialogue(null);
                  setPlayMode('overworld');
                }}
              />
            )}

            {toastNotice && (
              <div
                role="status"
                className="pointer-events-none absolute top-4 left-1/2 z-30 -translate-x-1/2 border-2 border-[#FFE135] bg-black px-4 py-1.5 font-pixel-display text-xs tracking-wider text-[#FFE135]"
              >
                {toastNotice}
              </div>
            )}
          </main>

          {shellState === 'paused' && (
            <PauseModal
              muted={muted}
              onResume={() => setShellState('playing')}
              onRestart={startFreshRun}
              onReturnTitle={() => {
                setPlayMode('overworld');
                setShellState('title');
              }}
              onToggleMute={toggleMute}
            />
          )}

          {shellState === 'gameover' && runOutcome && (
            <OutcomeModal
              outcome={runOutcome}
              onRetryCheckpoint={savedSnapshot ? continueSavedRun : undefined}
              onPlayAgain={startFreshRun}
              onReturnTitle={() => {
                setRunOutcome(null);
                setPlayMode('overworld');
                setShellState('title');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
