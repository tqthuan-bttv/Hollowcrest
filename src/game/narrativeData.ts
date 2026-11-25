import type {
  DialogueLine,
  EnemyDefinition,
  EnemyId,
  EndingType,
  InventoryItem,
  NarrativeBranch,
  RoomDefinition,
  RoomId,
  RunOutcome,
  TileKind,
  WorldProgress,
} from './types';
import { getNarrativeBranch } from './combatEngine';

export const ITEMS: Record<string, InventoryItem> = {
  spore_tea: {
    id: 'spore_tea',
    name: 'Warm Spore Tea',
    shortName: 'Spore Tea',
    description: 'Steeped luminescent moss. Restores 12 HP.',
    healAmount: 12,
  },
  sun_biscuit: {
    id: 'sun_biscuit',
    name: 'Sunlit Biscuit',
    shortName: 'SunBiscuit',
    description: 'Tastes like summer mornings. Restores 16 HP.',
    healAmount: 16,
  },
  iron_shard: {
    id: 'iron_shard',
    name: 'Resolve Shard',
    shortName: 'Res.Shard',
    description: 'Sharpens determination (+6 ATK this fight, +8 HP).',
    healAmount: 8,
    atkBoost: 6,
  },
};

export const INITIAL_INVENTORY: InventoryItem[] = [ITEMS.spore_tea, ITEMS.sun_biscuit];

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  bramblekin: {
    id: 'bramblekin',
    name: 'Bramblekin',
    title: 'Timid Moss Sproutling',
    maxHp: 28,
    atk: 4,
    def: 3,
    expReward: 12,
    goldReward: 18,
    mercyThreshold: 2,
    pattern: 'spores',
    introText: '* Bramblekin rustles nervously in front of the archway!',
    flavorLines: [
      '* Bramblekin clutches its leafy hood tight.',
      '* Tiny golden spores drift from Bramblekin’s cap.',
      '* Bramblekin peeks through one wide leaf.',
    ],
    hurtLines: [
      '* Bramblekin recoils, shedding bruised leaves!',
      '* Bramblekin trembles and pulls its hood lower.',
    ],
    lowHpLines: ['* Bramblekin looks ready to bolt into the moss.'],
    spareReadyLine: '* Bramblekin is humming softly. Its name glows YELLOW.',
    sparedText: '* YOU WON! You earned 0 EXP and 18 GOLD.',
    slainText: '* YOU WON! You earned 12 EXP and 18 GOLD.',
    acts: [
      {
        id: 'check',
        label: 'Check',
        description: 'Inspect Bramblekin stats.',
        mercyGain: 0,
        isCheck: true,
        flavorResponse: '* BRAMBLEKIN — ATK 4 DEF 3. Guarding the gate only because it was told to.',
        enemyBubble: 'D-don’t stare so hard...',
      },
      {
        id: 'compliment',
        label: 'Compliment',
        description: 'Praise its luminous sprout.',
        mercyGain: 1,
        flavorResponse: '* You tell Bramblekin its golden bud lights up the whole ruin.',
        enemyBubble: 'R-really? Even down here?',
      },
      {
        id: 'hum',
        label: 'Hum Lullaby',
        description: 'Calm its trembling leaves.',
        mercyGain: 1,
        flavorResponse: '* You hum a gentle surface tune. Bramblekin sways along.',
        enemyBubble: 'Oh... I know that rhythm...',
      },
      {
        id: 'step_back',
        label: 'Lower Guard',
        description: 'Show you mean no harm.',
        mercyGain: 2,
        flavorResponse: '* You step back and smile calmly. Bramblekin sighs in relief.',
        enemyBubble: 'Wait... you aren’t going to uproot me?',
      },
    ],
  },
  vespera: {
    id: 'vespera',
    name: 'Vespera',
    title: 'Lantern-Moth Sentinel',
    maxHp: 46,
    atk: 6,
    def: 5,
    expReward: 24,
    goldReward: 28,
    mercyThreshold: 3,
    pattern: 'prism_moths',
    introText: '* Vespera descends on velvet wings, lantern aglow!',
    flavorLines: [
      '* Vespera adjusts her tattered sentinel sash.',
      '* Cyan dust glitters around Vespera’s lantern.',
      '* Vespera watches your SOUL with quiet pride.',
    ],
    hurtLines: [
      '* Vespera’s lantern flickers violently!',
      '* A crack runs across Vespera’s wing crest.',
    ],
    lowHpLines: ['* Vespera steadies herself on one knee, refusing to yield easily.'],
    spareReadyLine: '* Vespera dims her lantern in salute. Mercy is open!',
    sparedText: '* YOU WON! You earned 0 EXP and 28 GOLD.',
    slainText: '* YOU WON! You earned 24 EXP and 28 GOLD.',
    acts: [
      {
        id: 'check',
        label: 'Check',
        description: 'Inspect Vespera stats.',
        mercyGain: 0,
        isCheck: true,
        flavorResponse: '* VESPERA — ATK 6 DEF 5. Sworn to watch a hall no traveler has crossed in years.',
        enemyBubble: 'State your purpose, wanderer.',
      },
      {
        id: 'salute',
        label: 'Salute',
        description: 'Honor her vigil.',
        mercyGain: 1,
        flavorResponse: '* You offer a crisp sentinel salute. Vespera blinks in surprise.',
        enemyBubble: 'You know the old crest...?',
      },
      {
        id: 'lantern',
        label: 'Admire Glow',
        description: 'Speak of the gallery lights.',
        mercyGain: 1,
        flavorResponse: '* You praise how cleanly her lantern pierces the cavern mist.',
        enemyBubble: 'Someone finally noticed the polish!',
      },
      {
        id: 'promise',
        label: 'Share Story',
        description: 'Tell her of the surface sky.',
        mercyGain: 2,
        flavorResponse: '* You describe dawn clouds and wind. Vespera lowers her lance.',
        enemyBubble: 'Sunlight... I had nearly forgotten.',
      },
    ],
  },
  malakor: {
    id: 'malakor',
    name: 'Warden Malakor',
    title: 'Obsidian Gatekeeper',
    maxHp: 76,
    atk: 7,
    def: 7,
    expReward: 45,
    goldReward: 50,
    mercyThreshold: 3,
    isBoss: true,
    pattern: 'obsidian_trials',
    introText: '* Warden Malakor slams his halberd down! The sanctum trembles!',
    flavorLines: [
      '* Malakor’s crimson visor burns against the obsidian dark.',
      '* Dust cascades from the sanctum dome.',
      '* The Gatekeeper weighs the measure of your SOUL.',
    ],
    hurtLines: [
      '* Sparks erupt from Malakor’s obsidian chestplate!',
      '* Malakor grunts, tightening his grip on the halberd.',
    ],
    lowHpLines: ['* Malakor breathes heavily. His armor glows like cooling embers.'],
    spareReadyLine: '* Malakor plants his halberd aside. He will listen if you SPARE.',
    sparedText: '* YOU WON! Warden Malakor yields the Surface Gate!',
    slainText: '* YOU WON! Warden Malakor shattered into silent ash.',
    acts: [
      {
        id: 'check',
        label: 'Check',
        description: 'Inspect Warden Malakor.',
        mercyGain: 0,
        isCheck: true,
        flavorResponse: '* WARDEN MALAKOR — ATK 7 DEF 7. Bound by oath to test all who seek the Surface.',
        enemyBubble: 'Prove your spirit!',
      },
      {
        id: 'reason',
        label: 'Reason',
        description: 'Speak without drawing steel.',
        mercyGain: 1,
        flavorResponse: '* You call out that the depths need no more bloodshed.',
        enemyBubble: 'Words are cheap in the dark...',
      },
      {
        id: 'stand_firm',
        label: 'Stand Firm',
        description: 'Refuse to strike back.',
        mercyGain: 1,
        flavorResponse: '* You plant your feet and lower your weapon. Malakor hesitates.',
        enemyBubble: 'Why do you not swing?!',
      },
      {
        id: 'appeal',
        label: 'Remind Oath',
        description: 'Remind him who the gate protects.',
        mercyGain: 2,
        flavorResponse: '* You remind Malakor that guards protect life, not empty stone.',
        enemyBubble: '...You sound like an old friend.',
      },
    ],
  },
};

function parseTileGrid(rows: string[]): TileKind[][] {
  return rows.map((row) =>
    row.split('').map((ch): TileKind => {
      if (ch === '#') return 1;
      if (ch === '~') return 2;
      if (ch === ',') return 3;
      if (ch === 'G') return 4;
      return 0;
    })
  );
}

export const ROOMS: Record<RoomId, RoomDefinition> = {
  mossy_threshold: {
    id: 'mossy_threshold',
    title: 'Mossy Threshold',
    subtitle: 'Zone 1 · Upper Ruins',
    width: 16,
    height: 12,
    floorColor: '#171422',
    accentColor: '#254236',
    wallColor: '#362B48',
    wallTopColor: '#544370',
    tiles: parseTileGrid([
      '################',
      '#....,,,,,,....#',
      '#..,........,..#',
      '#..............#',
      '#....,,,,,,....G',
      '#....,,,,,,....G',
      '#....,,,,,,....G',
      '#..............#',
      '#..,........,..#',
      '#....,,,,,,....#',
      '#..............#',
      '################',
    ]),
    interactables: [
      {
        id: 'star_1',
        kind: 'save_star',
        name: 'Anchor Star',
        x: 4,
        y: 3,
        spriteKey: 'save_star',
      },
      {
        id: 'tablet_1',
        kind: 'tablet',
        name: 'Stone Inscription',
        x: 6,
        y: 8,
        spriteKey: 'tablet',
      },
      {
        id: 'enemy_bramblekin',
        kind: 'enemy',
        name: 'Bramblekin',
        x: 12,
        y: 5,
        spriteKey: 'bramblekin',
        enemyId: 'bramblekin',
      },
    ],
    portals: [
      {
        x: 15,
        y: 4,
        w: 1,
        h: 3,
        targetRoom: 'whispering_gallery',
        spawnX: 2,
        spawnY: 5,
        spawnDir: 'right',
      },
    ],
  },
  whispering_gallery: {
    id: 'whispering_gallery',
    title: 'Whispering Gallery',
    subtitle: 'Zone 2 · Crystal Crossing',
    width: 18,
    height: 12,
    floorColor: '#111927',
    accentColor: '#1E3A5F',
    wallColor: '#1E293B',
    wallTopColor: '#334155',
    tiles: parseTileGrid([
      '##################',
      '#..~~~......~~~..#',
      '#..~~~......~~~..#',
      '#................#',
      'G....,,,,,,,,....G',
      'G....,,,,,,,,....G',
      'G....,,,,,,,,....G',
      '#................#',
      '#..~~~......~~~..#',
      '#..~~~......~~~..#',
      '#................#',
      '##################',
    ]),
    interactables: [
      {
        id: 'npc_pebble',
        kind: 'npc',
        name: 'Pebble',
        x: 5,
        y: 3,
        spriteKey: 'pebble',
      },
      {
        id: 'pedestal_shard',
        kind: 'item_pedestal',
        name: 'Echo Pedestal',
        x: 8,
        y: 9,
        spriteKey: 'pedestal',
        itemReward: ITEMS.iron_shard,
      },
      {
        id: 'star_2',
        kind: 'save_star',
        name: 'Anchor Star',
        x: 11,
        y: 3,
        spriteKey: 'save_star',
      },
      {
        id: 'enemy_vespera',
        kind: 'enemy',
        name: 'Vespera',
        x: 14,
        y: 5,
        spriteKey: 'vespera',
        enemyId: 'vespera',
      },
    ],
    portals: [
      {
        x: 0,
        y: 4,
        w: 1,
        h: 3,
        targetRoom: 'mossy_threshold',
        spawnX: 13,
        spawnY: 5,
        spawnDir: 'left',
      },
      {
        x: 17,
        y: 4,
        w: 1,
        h: 3,
        targetRoom: 'fractured_sanctum',
        spawnX: 2,
        spawnY: 6,
        spawnDir: 'right',
      },
    ],
  },
  fractured_sanctum: {
    id: 'fractured_sanctum',
    title: 'Fractured Sanctum',
    subtitle: 'Zone 3 · Surface Threshold',
    width: 16,
    height: 13,
    floorColor: '#161116',
    accentColor: '#3B1F2B',
    wallColor: '#271923',
    wallTopColor: '#4A2B3D',
    tiles: parseTileGrid([
      '#######GG#######',
      '#..............#',
      '#..#........#..#',
      '#..............#',
      '#....,,,,,,....#',
      '#....,,,,,,....#',
      'G....,,,,,,....#',
      'G....,,,,,,....#',
      '#....,,,,,,....#',
      '#..............#',
      '#..#........#..#',
      '#..............#',
      '################',
    ]),
    interactables: [
      {
        id: 'star_3',
        kind: 'save_star',
        name: 'Anchor Star',
        x: 4,
        y: 9,
        spriteKey: 'save_star',
      },
      {
        id: 'enemy_malakor',
        kind: 'enemy',
        name: 'Warden Malakor',
        x: 8,
        y: 4,
        spriteKey: 'malakor',
        enemyId: 'malakor',
      },
    ],
    portals: [
      {
        x: 0,
        y: 6,
        w: 1,
        h: 2,
        targetRoom: 'whispering_gallery',
        spawnX: 15,
        spawnY: 5,
        spawnDir: 'left',
      },
      {
        x: 7,
        y: 0,
        w: 2,
        h: 1,
        targetRoom: 'fractured_sanctum',
        spawnX: 7,
        spawnY: 2,
        spawnDir: 'up',
        requiresBossResolved: true,
      },
    ],
  },
};

export function getBranchingDialogue(
  interactableId: string,
  progress: WorldProgress,
  lv: number
): {
  lines: DialogueLine[];
  onCompleteAction?: 'start_combat' | 'heal_save' | 'take_item' | 'trigger_ending';
  enemyId?: EnemyId;
  itemReward?: InventoryItem;
} {
  const branch: NarrativeBranch = getNarrativeBranch(progress.sparedEnemies, progress.slainEnemies);

  if (interactableId.startsWith('star_')) {
    const reflection =
      branch === 'pacifist'
        ? '* The gentle warmth of mercy fills you with determination.'
        : branch === 'ruthless'
        ? `* The cavern feels eerily quiet around your shadow. (LV ${lv})`
        : '* A bittersweet resolve settles in your chest.';
    return {
      onCompleteAction: 'heal_save',
      lines: [
        {
          speaker: 'Anchor Star',
          text: `${reflection} (HP fully restored and progress anchored!)`,
        },
      ],
    };
  }

  if (interactableId === 'tablet_1') {
    return {
      lines: [
        {
          speaker: 'Ancient Inscription',
          text: '* "Those who strike down the lost inherit only silence. Those who listen may walk home together."',
        },
      ],
    };
  }

  if (interactableId === 'pedestal_shard') {
    if (progress.collectedItems.includes('pedestal_shard')) {
      return {
        lines: [{ speaker: 'Echo Pedestal', text: '* The pedestal hums faintly, already empty.' }],
      };
    }
    return {
      onCompleteAction: 'take_item',
      itemReward: ITEMS.iron_shard,
      lines: [
        {
          speaker: 'Echo Pedestal',
          text: '* Resting on the crystal plinth is a gleaming Resolve Shard!',
          choices: [
            { label: 'Take Resolve Shard', action: 'take_item' },
            { label: 'Leave it behind', action: 'close' },
          ],
        },
      ],
    };
  }

  if (interactableId === 'npc_pebble') {
    if (branch === 'ruthless') {
      return {
        lines: [
          {
            speaker: 'Pebble',
            portraitKey: 'pebble',
            text: '* ...Hey. Dust followed you through the eastern archway. Bramblekin didn’t run away, did they?',
          },
          {
            speaker: 'Pebble',
            portraitKey: 'pebble',
            text: '* Stay away from my moss, okay? Vespera up ahead won’t forgive that easily.',
          },
        ],
      };
    }
    if (progress.sparedEnemies.includes('bramblekin')) {
      return {
        lines: [
          {
            speaker: 'Pebble',
            portraitKey: 'pebble',
            text: '* Word travels fast through the roots! You actually listened to little Bramblekin.',
          },
          {
            speaker: 'Pebble',
            portraitKey: 'pebble',
            text: '* Vespera is proud, not cruel. Show her you remember the sky above, and she’ll hear you out.',
          },
        ],
      };
    }
    return {
      lines: [
        {
          speaker: 'Pebble',
          portraitKey: 'pebble',
          text: '* Careful crossing the bridge, traveler. Every guardian down here remembers how you treat the last.',
        },
      ],
    };
  }

  if (interactableId === 'enemy_bramblekin') {
    if (progress.sparedEnemies.includes('bramblekin')) {
      return {
        lines: [
          {
            speaker: 'Bramblekin',
            portraitKey: 'bramblekin',
            text: '* Oh! Good luck up ahead, friend! Don’t forget to hum if it gets scary!',
          },
        ],
      };
    }
    return {
      onCompleteAction: 'start_combat',
      enemyId: 'bramblekin',
      lines: [
        {
          speaker: 'Bramblekin',
          portraitKey: 'bramblekin',
          text: '* H-halt! Nobody passes the Mossy Threshold! ...Probably!',
        },
      ],
    };
  }

  if (interactableId === 'enemy_vespera') {
    if (progress.sparedEnemies.includes('vespera')) {
      return {
        lines: [
          {
            speaker: 'Vespera',
            portraitKey: 'vespera',
            text: '* Walk tall toward the Sanctum, wanderer. My lantern will light the hall behind you.',
          },
        ],
      };
    }
    const line =
      branch === 'ruthless'
        ? '* I smell scorched leaves on your cloak. Draw your blade—I will not let a butcher pass!'
        : progress.sparedEnemies.includes('bramblekin')
        ? '* Bramblekin chirped about a kind stranger. Let us test whether your heart matches your patience!'
        : '* Step into the lantern light, traveler. Only the worthy cross the Whispering Gallery!';
    return {
      onCompleteAction: 'start_combat',
      enemyId: 'vespera',
      lines: [{ speaker: 'Vespera', portraitKey: 'vespera', text: line }],
    };
  }

  if (interactableId === 'enemy_malakor') {
    if (progress.sparedEnemies.includes('malakor')) {
      return {
        onCompleteAction: 'trigger_ending',
        lines: [
          {
            speaker: 'Warden Malakor',
            portraitKey: 'malakor',
            text: '* The Surface Gate stands open behind me, friend. Shall we greet the dawn?',
            choices: [
              { label: 'Step into the Dawn', action: 'trigger_ending' },
              { label: 'Linger a moment', action: 'close' },
            ],
          },
        ],
      };
    }

    if (branch === 'pacifist') {
      return {
        onCompleteAction: 'start_combat',
        enemyId: 'malakor',
        lines: [
          {
            speaker: 'Warden Malakor',
            portraitKey: 'malakor',
            text: '* Both Bramblekin and Vespera spoke your name with warmth. Strange... no one walks these stones unstained.',
          },
          {
            speaker: 'Warden Malakor',
            portraitKey: 'malakor',
            text: '* Still, the Surface Gate answers only to trial. Show me your resolve—whether of mercy or steel!',
          },
        ],
      };
    }

    if (branch === 'ruthless') {
      return {
        onCompleteAction: 'start_combat',
        enemyId: 'malakor',
        lines: [
          {
            speaker: 'Warden Malakor',
            portraitKey: 'malakor',
            text: `* ...Silence precedes you. LV ${lv}. Every lantern in the lower halls has gone cold.`,
          },
          {
            speaker: 'Warden Malakor',
            portraitKey: 'malakor',
            text: '* I am the last oath of Hollowcrest. Come—let us see what your violence buys!',
          },
        ],
      };
    }

    return {
      onCompleteAction: 'start_combat',
      enemyId: 'malakor',
      lines: [
        {
          speaker: 'Warden Malakor',
          portraitKey: 'malakor',
          text: '* You carry both mercy and ash on your hands. The Sanctum weighs the balance now!',
        },
      ],
    };
  }

  return {
    lines: [{ speaker: 'Narrator', text: '* Nothing answers.' }],
  };
}

export function buildEndingOutcome(
  ending: EndingType,
  progress: WorldProgress,
  lv: number,
  hp: number,
  maxHp: number,
  gold: number
): RunOutcome {
  const zoneTitle = ROOMS[progress.room].title;
  const baseStats = {
    lv,
    hp,
    maxHp,
    gold,
    sparedCount: progress.sparedEnemies.length,
    slainCount: progress.slainEnemies.length,
    zoneReached: zoneTitle,
    turnsTaken: progress.turnsTaken,
    damageTaken: progress.damageTaken,
  };

  if (ending === 'pacifist') {
    return {
      ending: 'pacifist',
      title: 'True Mercy · Dawn Over Hollowcrest',
      epilogue: [
        'Warden Malakor unbars the great obsidian seal, and golden morning spills down the mossy stairs.',
        'Bramblekin peeks up beside Vespera’s glowing lantern as the forgotten guardians take their first breath of open sky.',
        'You leave the Ashen Depths not as a conqueror, but as the bridge that brought them home.',
      ],
      stats: baseStats,
    };
  }

  if (ending === 'ruthless') {
    return {
      ending: 'ruthless',
      title: 'Ash Path · Silence of the Depths',
      epilogue: [
        'The Sanctum gate grinds open into a pale, windless dawn. No footsteps echo behind you.',
        'At LV ' + lv + ', nothing in Hollowcrest remains to block your path—or remember your name.',
        'You step out onto the ridge alone, carrying only quiet dust and cold gold.',
      ],
      stats: baseStats,
    };
  }

  if (ending === 'neutral') {
    return {
      ending: 'neutral',
      title: 'Twilight Path · A Quiet Passage',
      epilogue: [
        'The Surface Gate opens onto a slate-blue dusk. Some guardians watch from the shadows; others are gone.',
        'Your choices saved lives and ended others, leaving Hollowcrest neither healed nor wholly broken.',
        'Perhaps on another climb, a gentler resolve might change what waits beyond the threshold.',
      ],
      stats: baseStats,
    };
  }

  return {
    ending: 'defeat',
    title: 'Your SOUL Shattered',
    epilogue: [
      'The cavern swallows the last crimson spark—yet a distant Anchor Star still remembers your name.',
      'Stay determined. Every pattern can be learned, and every heart can still be reached.',
    ],
    stats: baseStats,
  };
}
