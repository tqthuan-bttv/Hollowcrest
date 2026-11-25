// Crisp pixel-art sprite matrices rendered cleanly on Canvas2D (no external assets)

type Palette = Record<string, string>;

export interface PixelSpriteData {
  grid: string[];
  palette: Palette;
}

const HERO_PALETTE: Palette = {
  H: '#4B2E1E', // hair
  S: '#FFD8B0', // skin
  E: '#14121D', // eyes
  B: '#3A7BD5', // tunic blue
  C: '#D6457A', // stripe magenta/rose
  P: '#2C263B', // pants
  O: '#1A1311', // boots
};

export const HERO_SPRITE_DOWN: PixelSpriteData = {
  palette: HERO_PALETTE,
  grid: [
    '....HHHHHH....',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '...HSSSSSSH...',
    '...HSEESSH....',
    '....SSSSSS....',
    '...BBBBBBBB...',
    '..BBCCCCCCBB..',
    '..SSBBBBBBSS..',
    '...BBBBBBBB...',
    '...PPPPPPPP...',
    '...PPP..PPP...',
    '...PPP..PPP...',
    '...OO....OO...',
  ],
};

export const HERO_SPRITE_DOWN_WALK: PixelSpriteData = {
  palette: HERO_PALETTE,
  grid: [
    '....HHHHHH....',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '...HSSSSSSH...',
    '...HSEESSH....',
    '....SSSSSS....',
    '...BBBBBBBB...',
    '..SSCCCCCCSS..',
    '...BBBBBBBB...',
    '...BBBBBBBB...',
    '...PPPPPPPP...',
    '...PPP..PPP...',
    '..OO......OO..',
    '..............',
  ],
};

export const HERO_SPRITE_UP: PixelSpriteData = {
  palette: HERO_PALETTE,
  grid: [
    '....HHHHHH....',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '....HHHHHH....',
    '...BBBBBBBB...',
    '..BBCCCCCCBB..',
    '..SSBBBBBBSS..',
    '...BBBBBBBB...',
    '...PPPPPPPP...',
    '...PPP..PPP...',
    '...PPP..PPP...',
    '...OO....OO...',
  ],
};

export const HERO_SPRITE_SIDE: PixelSpriteData = {
  palette: HERO_PALETTE,
  grid: [
    '....HHHHHH....',
    '...HHHHHHHH...',
    '...HHHHHHHH...',
    '...HHHSSSS....',
    '...HHHSEES....',
    '....HHSSSS....',
    '...BBBBBBBB...',
    '...BCCCCCCB...',
    '...SSBBBBBB...',
    '...BBBBBBBB...',
    '...PPPPPPPP...',
    '....PPP.PPP...',
    '....PPP.PPP...',
    '....OO...OO...',
  ],
};

export const BRAMBLEKIN_SPRITE: PixelSpriteData = {
  palette: {
    L: '#5FD368', // bright leaf
    G: '#2D8643', // moss green
    D: '#1A4E2A', // deep green
    W: '#FFFFFF', // eyes/outline
    K: '#0B0B10', // pupil
    B: '#7F5539', // stem/boots
    P: '#FFE135', // spore bud
  },
  grid: [
    '......PP......',
    '.....LGGLL....',
    '...LLLGGGGLL..',
    '..LLGGGGGGGG..',
    '.LGDDDDDDDDGL.',
    '.LGDDWWWWDDGL.',
    '.LGDDWKWWKDGL.',
    '.LGDDDDDDDDGL.',
    '..GGDDDDDDGG..',
    '...GGGGGGGG...',
    '..LLGGGGGGLL..',
    '...BBBBBBBB...',
    '...BB....BB...',
    '..BBB....BBB..',
  ],
};

export const VESPERA_SPRITE: PixelSpriteData = {
  palette: {
    W: '#F4F4F8', // pale cloak/antlers
    C: '#67E8F9', // cyan lantern glow
    V: '#8B5CF6', // violet wing
    D: '#2E1065', // dark armor
    K: '#090910', // eye mask
    G: '#FDE047', // lantern core
  },
  grid: [
    '..W........W..',
    '..WW......WW..',
    '...WW.WW.WW...',
    '.VV.WWWWWW.VV.',
    'VVVVWKKKKWVVVV',
    'VVVVWKCCKWVVVV',
    'VVDDWWWWWWDDVV',
    '.VDDWWGGWWDDV.',
    '..DDDDGGDDDD..',
    '..DDDDDDDDDD..',
    '...DDDDDDDD...',
    '...DD.DD.DD...',
    '..DD..DD..DD..',
    '......DD......',
  ],
};

export const MALAKOR_SPRITE: PixelSpriteData = {
  palette: {
    H: '#CBD5E1', // bone horns
    A: '#1E293B', // obsidian armor
    M: '#475569', // armor highlight
    R: '#FF2A3B', // crimson eyes/core
    G: '#F59E0B', // gold trim
    K: '#050508', // visor void
  },
  grid: [
    '.HH........HH.',
    '.HHH......HHH.',
    '..HHH.MM.HHH..',
    '...MMMMMMMM...',
    '..AAKKKKKKAA..',
    '..AAKRKKRKAA..',
    '.MMMAAAAAAMMM.',
    'MMAAAGGGGAAAMM',
    'MMAAARRRRAAAMM',
    'MMAAAGGGGAAAMM',
    '.MMAAAAAAAAAM.',
    '..AAAAAAAAA...',
    '..AAA....AAA..',
    '.GGGG....GGGG.',
  ],
};

export const PEBBLE_SPRITE: PixelSpriteData = {
  palette: {
    S: '#94A3B8', // stone
    L: '#CBD5E1', // highlight
    D: '#475569', // shadow
    W: '#FFFFFF', // eyes
    K: '#0F172A', // pupil
    M: '#4ADE80', // moss patch
  },
  grid: [
    '....MMMMM.....',
    '...MLLLLSSM...',
    '..LLLLSSSSSS..',
    '.LLLSSSSSSSSS.',
    '.LLSSWWSSWWSS.',
    '.LLSSWKSSWKSS.',
    '.LLSSSSSSSSSS.',
    '.DDSSKKKKSSDD.',
    '..DDSSSSSSDD..',
    '..DDDDDDDDDD..',
    '...DDD..DDD...',
    '...DDD..DDD...',
  ],
};

export const SAVE_STAR_SPRITE: PixelSpriteData = {
  palette: {
    Y: '#FFE135',
    W: '#FFFBEB',
    O: '#F59E0B',
  },
  grid: [
    '.....YY.....',
    '.....YY.....',
    '....YWWY....',
    '..YYWWWWYY..',
    'YYYYWWWWYYYY',
    '.OOYWWWWYOO.',
    '...YWWWWY...',
    '..YYWWWWYY..',
    '.YY..YY..YY.',
    '.O...OO...O.',
  ],
};

export const PEDESTAL_SPRITE: PixelSpriteData = {
  palette: {
    C: '#38BDF8',
    W: '#E0F2FE',
    S: '#64748B',
    D: '#334155',
  },
  grid: [
    '....WWWW....',
    '...WCCCCW...',
    '...WCCCCW...',
    '....CCCC....',
    '..SSSSSSSS..',
    '.SSDDDDDDSS.',
    '..DDDDDDDD..',
    '..DDDDDDDD..',
    '.SSSSSSSSSS.',
  ],
};

export const TABLET_SPRITE: PixelSpriteData = {
  palette: {
    L: '#94A3B8',
    D: '#475569',
    G: '#38BDF8',
  },
  grid: [
    '..LLLLLLLL..',
    '.LLLLLLLLLL.',
    '.LLGGGGGGLL.',
    '.LLLLLLLLLL.',
    '.LLGGGGGGLL.',
    '.LLDDDDDDLL.',
    '.DDDDDDDDDD.',
    '.DDDDDDDDDD.',
  ],
};

export const SOUL_HEART_GRID: string[] = [
  '.RR..RR.',
  'RRRRRRRR',
  'RRRRRRRR',
  'RRRRRRRR',
  '.RRRRRR.',
  '..RRRR..',
  '...RR...',
];

export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: PixelSpriteData,
  dx: number,
  dy: number,
  pixelSize: number,
  options?: { flipX?: boolean; flashWhite?: boolean; alpha?: number }
) {
  const rows = sprite.grid.length;
  const cols = sprite.grid[0]?.length ?? 0;
  ctx.save();
  if (options?.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }
  for (let r = 0; r < rows; r++) {
    const row = sprite.grid[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = options?.flashWhite ? '#FFFFFF' : sprite.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const drawCol = options?.flipX ? cols - 1 - c : c;
      ctx.fillRect(
        Math.round(dx + drawCol * pixelSize),
        Math.round(dy + r * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }
  ctx.restore();
}

export function drawSoulHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pixelSize: number,
  color = '#FF2A3B',
  alpha = 1
) {
  const rows = SOUL_HEART_GRID.length;
  const cols = SOUL_HEART_GRID[0].length;
  const startX = cx - (cols * pixelSize) / 2;
  const startY = cy - (rows * pixelSize) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (SOUL_HEART_GRID[r][c] === 'R') {
        ctx.fillRect(
          Math.round(startX + c * pixelSize),
          Math.round(startY + r * pixelSize),
          Math.ceil(pixelSize),
          Math.ceil(pixelSize)
        );
      }
    }
  }
  ctx.restore();
}

export function getEnemySprite(id: string): PixelSpriteData {
  switch (id) {
    case 'bramblekin':
      return BRAMBLEKIN_SPRITE;
    case 'vespera':
      return VESPERA_SPRITE;
    case 'malakor':
      return MALAKOR_SPRITE;
    case 'pebble':
      return PEBBLE_SPRITE;
    default:
      return BRAMBLEKIN_SPRITE;
  }
}
