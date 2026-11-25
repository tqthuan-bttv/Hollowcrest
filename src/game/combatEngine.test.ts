import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_PLAYER_STATS,
  applyExpGain,
  calculateFightDamage,
  isEnemySpareable,
  getNarrativeBranch,
  determineEnding,
  clampSoulPosition,
  checkBulletCollision,
  calculateEnemyDamageTaken,
} from './combatEngine';
import type { BulletEntity, EnemyDefinition, WorldProgress } from './types';

const mockEnemy: EnemyDefinition = {
  id: 'bramblekin',
  name: 'Bramblekin',
  title: 'Moss Sproutling',
  maxHp: 30,
  atk: 5,
  def: 4,
  expReward: 12,
  goldReward: 15,
  mercyThreshold: 2,
  pattern: 'spores',
  introText: '* Bramblekin blocks the path.',
  flavorLines: ['* Shivers quietly.'],
  hurtLines: ['* Leaves scatter.'],
  lowHpLines: ['* Wants to flee.'],
  spareReadyLine: '* Bramblekin is smiling softly.',
  sparedText: '* You spared Bramblekin!',
  slainText: '* Bramblekin turned to ash.',
  acts: [],
};

test('calculateFightDamage rewards center timing with critical hit', () => {
  const crit = calculateFightDamage(10, 0, 4, 0.5);
  const edge = calculateFightDamage(10, 0, 4, 0.05);
  assert.equal(crit.isCrit, true);
  assert.equal(edge.isCrit, false);
  assert.ok(crit.damage > edge.damage);
});

test('applyExpGain levels up player and boosts maxHp/ATK', () => {
  const afterKill = applyExpGain(INITIAL_PLAYER_STATS, 15, 10);
  assert.equal(afterKill.lv, 2);
  assert.equal(afterKill.maxHp, 24);
  assert.equal(afterKill.atk, 12);
  assert.equal(afterKill.gold, 10);
});

test('isEnemySpareable triggers on mercy threshold or low HP for non-bosses', () => {
  assert.equal(isEnemySpareable(mockEnemy, 1, 30), false);
  assert.equal(isEnemySpareable(mockEnemy, 2, 30), true);
  assert.equal(isEnemySpareable(mockEnemy, 0, 6), true);

  const bossEnemy: EnemyDefinition = { ...mockEnemy, id: 'malakor', isBoss: true };
  assert.equal(isEnemySpareable(bossEnemy, 0, 5), false);
  assert.equal(isEnemySpareable(bossEnemy, 2, 30), true);
});

test('narrative branch and ending resolve across Pacifist, Neutral, and Ruthless paths', () => {
  assert.equal(getNarrativeBranch(['bramblekin'], []), 'pacifist');
  assert.equal(getNarrativeBranch(['bramblekin'], ['vespera']), 'neutral');
  assert.equal(getNarrativeBranch([], ['bramblekin', 'vespera']), 'ruthless');

  const baseProgress: WorldProgress = {
    room: 'fractured_sanctum',
    playerX: 160,
    playerY: 160,
    playerDir: 'up',
    sparedEnemies: ['bramblekin', 'vespera', 'malakor'],
    slainEnemies: [],
    collectedItems: [],
    turnsTaken: 10,
    damageTaken: 4,
  };

  assert.equal(determineEnding(baseProgress), 'pacifist');
  assert.equal(
    determineEnding({ ...baseProgress, sparedEnemies: ['bramblekin'], slainEnemies: ['vespera', 'malakor'] }),
    'neutral'
  );
  assert.equal(
    determineEnding({ ...baseProgress, sparedEnemies: [], slainEnemies: ['bramblekin', 'vespera', 'malakor'] }),
    'ruthless'
  );
});

test('clampSoulPosition keeps SOUL inside battle arena bounds', () => {
  const clamped = clampSoulPosition(-15, 250, 7, 180, 180);
  assert.equal(clamped.x, 9);
  assert.equal(clamped.y, 171);
});

test('checkBulletCollision ignores telegraph beams and detects active hits', () => {
  const telegraph: BulletEntity = {
    id: 1,
    x: 90,
    y: 90,
    vx: 0,
    vy: 0,
    radius: 8,
    kind: 'beam_telegraph',
    age: 0.1,
    maxAge: 0.5,
    damage: 5,
    width: 180,
    height: 20,
  };
  assert.equal(checkBulletCollision(90, 90, 6, telegraph), false);

  const activeOrb: BulletEntity = {
    ...telegraph,
    kind: 'orb',
    radius: 6,
  };
  assert.equal(checkBulletCollision(95, 90, 6, activeOrb), true);
  assert.equal(checkBulletCollision(120, 120, 6, activeOrb), false);
});

test('calculateEnemyDamageTaken applies defense mitigation with minimum floor', () => {
  assert.equal(calculateEnemyDamageTaken(6, 10), 6);
  assert.equal(calculateEnemyDamageTaken(6, 20), 3);
  assert.equal(calculateEnemyDamageTaken(2, 30), 2);
});
