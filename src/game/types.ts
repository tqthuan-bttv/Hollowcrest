export type GameShellState = 'title' | 'playing' | 'paused' | 'gameover';

export type PlayMode = 'overworld' | 'dialogue' | 'combat';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type EnemyId = 'bramblekin' | 'vespera' | 'malakor';

export type NarrativeBranch = 'pacifist' | 'neutral' | 'ruthless';

export type EndingType = 'pacifist' | 'neutral' | 'ruthless' | 'defeat';

export interface InventoryItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  healAmount: number;
  atkBoost?: number;
}

export interface PlayerStats {
  name: string;
  lv: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  tempAtkBoost: number;
}

export interface ActOption {
  id: string;
  label: string;
  description: string;
  mercyGain: number;
  flavorResponse: string;
  enemyBubble: string;
  /** Optional condition or special effect */
  isCheck?: boolean;
  requiresProgress?: number;
}

export type BulletPatternType = 'spores' | 'prism_moths' | 'obsidian_trials';

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  title: string;
  maxHp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  mercyThreshold: number;
  isBoss?: boolean;
  pattern: BulletPatternType;
  introText: string;
  flavorLines: string[];
  hurtLines: string[];
  lowHpLines: string[];
  spareReadyLine: string;
  sparedText: string;
  slainText: string;
  acts: ActOption[];
}

export type RoomId = 'mossy_threshold' | 'whispering_gallery' | 'fractured_sanctum';

export type TileKind = 0 | 1 | 2 | 3 | 4;
// 0 = floor, 1 = wall/pillar, 2 = water/chasm, 3 = moss/bridge accent, 4 = gate/portal

export interface InteractableEntity {
  id: string;
  kind: 'save_star' | 'tablet' | 'npc' | 'enemy' | 'item_pedestal' | 'gate';
  name: string;
  x: number; // tile x
  y: number; // tile y
  spriteKey: string;
  enemyId?: EnemyId;
  itemReward?: InventoryItem;
  targetRoom?: RoomId;
  spawnX?: number;
  spawnY?: number;
}

export interface PortalZone {
  x: number;
  y: number;
  w: number;
  h: number;
  targetRoom: RoomId;
  spawnX: number;
  spawnY: number;
  spawnDir: Direction;
  requiresBossResolved?: boolean;
}

export interface RoomDefinition {
  id: RoomId;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  floorColor: string;
  accentColor: string;
  wallColor: string;
  wallTopColor: string;
  tiles: TileKind[][];
  interactables: InteractableEntity[];
  portals: PortalZone[];
}

export interface DialogueChoice {
  label: string;
  action: 'next' | 'start_combat' | 'heal_save' | 'take_item' | 'trigger_ending' | 'close';
  nextLineIndex?: number;
}

export interface DialogueLine {
  speaker: string;
  portraitKey?: string;
  text: string;
  choices?: DialogueChoice[];
}

export interface ActiveDialogue {
  sourceId: string;
  lines: DialogueLine[];
  index: number;
  onCompleteAction?: 'start_combat' | 'heal_save' | 'take_item' | 'trigger_ending';
  enemyId?: EnemyId;
  itemReward?: InventoryItem;
}

export interface RunOutcome {
  ending: EndingType;
  title: string;
  epilogue: string[];
  stats: {
    lv: number;
    hp: number;
    maxHp: number;
    gold: number;
    sparedCount: number;
    slainCount: number;
    zoneReached: string;
    turnsTaken: number;
    damageTaken: number;
  };
}

export interface BulletEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'orb' | 'blade' | 'beam_telegraph' | 'beam_active' | 'shard' | 'ring';
  age: number;
  maxAge: number;
  damage: number;
  telegraphDuration?: number;
  width?: number;
  height?: number;
}

export interface WorldProgress {
  room: RoomId;
  playerX: number; // pixel center in tile coords * TILE_SIZE
  playerY: number;
  playerDir: Direction;
  sparedEnemies: EnemyId[];
  slainEnemies: EnemyId[];
  collectedItems: string[];
  turnsTaken: number;
  damageTaken: number;
}
