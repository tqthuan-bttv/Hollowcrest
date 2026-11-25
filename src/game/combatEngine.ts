import type {
  BulletEntity,
  EnemyDefinition,
  EnemyId,
  EndingType,
  NarrativeBranch,
  PlayerStats,
  WorldProgress,
} from './types';

export const TILE_SIZE = 32;

export const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'CHARA',
  lv: 1,
  exp: 0,
  hp: 20,
  maxHp: 20,
  atk: 10,
  def: 10,
  gold: 0,
  tempAtkBoost: 0,
};

const LV_THRESHOLDS = [0, 10, 30, 70, 120, 200];

export function computeLevelFromExp(exp: number): number {
  let lv = 1;
  for (let i = 1; i < LV_THRESHOLDS.length; i++) {
    if (exp >= LV_THRESHOLDS[i]) {
      lv = i + 1;
    }
  }
  return lv;
}

export function applyExpGain(stats: PlayerStats, gainedExp: number, gainedGold: number): PlayerStats {
  const newExp = stats.exp + Math.max(0, gainedExp);
  const newLv = computeLevelFromExp(newExp);
  const lvDelta = newLv - stats.lv;
  const newMaxHp = stats.maxHp + lvDelta * 4;
  const newHp = lvDelta > 0 ? Math.min(newMaxHp, stats.hp + lvDelta * 4) : stats.hp;

  return {
    ...stats,
    exp: newExp,
    lv: newLv,
    maxHp: newMaxHp,
    hp: newHp,
    atk: stats.atk + lvDelta * 2,
    def: stats.def + lvDelta * 2,
    gold: stats.gold + Math.max(0, gainedGold),
    tempAtkBoost: 0,
  };
}

/**
 * Computes Undertale-style timing bar damage.
 * cursorPos is normalized 0..1 where 0.5 is dead center (critical hit).
 */
export function calculateFightDamage(
  playerAtk: number,
  tempAtkBoost: number,
  enemyDef: number,
  cursorPos: number
): { damage: number; accuracy: number; isCrit: boolean } {
  const clampedPos = Math.max(0, Math.min(1, cursorPos));
  const distFromCenter = Math.abs(clampedPos - 0.5) * 2; // 0 = perfect center, 1 = far edge
  const accuracy = Math.max(0.15, 1 - distFromCenter * 0.85);
  const isCrit = distFromCenter <= 0.14;

  const baseAttack = playerAtk + tempAtkBoost;
  const raw = Math.max(2, baseAttack - Math.floor(enemyDef * 0.35));
  const multiplier = isCrit ? 1.65 : 0.7 + accuracy * 0.65;
  const damage = Math.max(1, Math.round(raw * multiplier));

  return { damage, accuracy, isCrit };
}

export function isEnemySpareable(
  enemy: EnemyDefinition,
  mercyProgress: number,
  currentHp: number
): boolean {
  if (mercyProgress >= enemy.mercyThreshold) return true;
  // Weakened non-boss enemies can also yield when brought under 25% HP
  if (!enemy.isBoss && currentHp > 0 && currentHp <= Math.ceil(enemy.maxHp * 0.25)) {
    return true;
  }
  return false;
}

export function getNarrativeBranch(
  sparedEnemies: EnemyId[],
  slainEnemies: EnemyId[]
): NarrativeBranch {
  if (slainEnemies.length === 0) return 'pacifist';
  if (sparedEnemies.length === 0 && slainEnemies.length > 0) return 'ruthless';
  return 'neutral';
}

export function determineEnding(progress: WorldProgress): EndingType {
  if (progress.slainEnemies.length === 0 && progress.sparedEnemies.length >= 3) {
    return 'pacifist';
  }
  if (progress.sparedEnemies.length === 0 && progress.slainEnemies.length >= 3) {
    return 'ruthless';
  }
  return 'neutral';
}

export function clampSoulPosition(
  x: number,
  y: number,
  soulRadius: number,
  arenaWidth: number,
  arenaHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(soulRadius + 2, Math.min(arenaWidth - soulRadius - 2, x)),
    y: Math.max(soulRadius + 2, Math.min(arenaHeight - soulRadius - 2, y)),
  };
}

export function checkBulletCollision(
  soulX: number,
  soulY: number,
  soulRadius: number,
  bullet: BulletEntity
): boolean {
  // Telegraph lines do not deal damage yet
  if (bullet.kind === 'beam_telegraph') return false;

  if (bullet.kind === 'beam_active' && bullet.width && bullet.height) {
    const halfW = bullet.width / 2;
    const halfH = bullet.height / 2;
    const closestX = Math.max(bullet.x - halfW, Math.min(soulX, bullet.x + halfW));
    const closestY = Math.max(bullet.y - halfH, Math.min(soulY, bullet.y + halfH));
    const dx = soulX - closestX;
    const dy = soulY - closestY;
    return dx * dx + dy * dy <= soulRadius * soulRadius;
  }

  const dx = soulX - bullet.x;
  const dy = soulY - bullet.y;
  const minDist = soulRadius + bullet.radius;
  return dx * dx + dy * dy <= minDist * minDist;
}

export function calculateEnemyDamageTaken(enemyAtk: number, playerDef: number): number {
  const mitigation = Math.floor((playerDef - 10) * 0.3);
  return Math.max(2, enemyAtk - mitigation);
}
