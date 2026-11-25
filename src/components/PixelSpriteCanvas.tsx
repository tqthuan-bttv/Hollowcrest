import { useEffect, useRef } from 'react';
import { drawPixelSprite, drawSoulHeart, getEnemySprite } from '../game/pixelSprites';

interface PixelSpriteCanvasProps {
  spriteKey: string;
  pixelSize?: number;
  flashWhite?: boolean;
  spared?: boolean;
  slain?: boolean;
  className?: string;
}

export function PixelSpriteCanvas({
  spriteKey,
  pixelSize = 6,
  flashWhite = false,
  spared = false,
  slain = false,
  className = '',
}: PixelSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (spriteKey === 'soul') {
      drawSoulHeart(ctx, canvas.width / 2, canvas.height / 2, pixelSize, '#FF2A3B', 1);
      return;
    }

    const sprite = getEnemySprite(spriteKey);
    const cols = sprite.grid[0]?.length ?? 14;
    const rows = sprite.grid.length;
    const drawW = cols * pixelSize;
    const drawH = rows * pixelSize;
    const ox = Math.floor((canvas.width - drawW) / 2);
    const oy = Math.floor((canvas.height - drawH) / 2);

    drawPixelSprite(ctx, sprite, ox, oy, pixelSize, {
      flashWhite,
      alpha: slain ? 0.15 : spared ? 0.55 : 1,
    });
  }, [spriteKey, pixelSize, flashWhite, spared, slain]);

  const sprite = spriteKey === 'soul' ? null : getEnemySprite(spriteKey);
  const cols = sprite ? sprite.grid[0]?.length ?? 14 : 10;
  const rows = sprite ? sprite.grid.length : 9;
  const width = cols * pixelSize + 8;
  const height = rows * pixelSize + 8;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pixelated block ${className}`}
      aria-hidden="true"
    />
  );
}
