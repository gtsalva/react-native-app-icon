import sharp, { Sharp } from 'sharp';
import { parse, formatHex } from 'culori';
import { Background, Transform } from '../config';

export interface RenderOptions {
  size: number;
  background?: Background;
  transform: Transform;
  format?: 'png' | 'webp';
}

export async function renderIcon(sourcePath: string, opts: RenderOptions): Promise<Buffer> {
  const { size, background, transform, format = 'png' } = opts;

  // No background — just resize the source image as-is
  if (!background) {
    let img = sharp(sourcePath).resize(size, size, { fit: 'cover' });
    if (transform.rotate !== 0) img = img.rotate(transform.rotate);
    if (transform.flipX) img = img.flop();
    if (transform.flipY) img = img.flip();
    const buf = await img.png().toBuffer();
    if (format === 'webp') return sharp(buf).webp({ quality: 100, lossless: true }).toBuffer();
    return buf;
  }

  const paddingPx = Math.round(size * transform.padding);
  const iconSize = size - paddingPx * 2;

  let icon = sharp(sourcePath).resize(iconSize, iconSize, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (transform.rotate !== 0) {
    icon = icon.rotate(transform.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  if (transform.flipX) icon = icon.flop();
  if (transform.flipY) icon = icon.flip();
  if (transform.scale !== 1.0) {
    const scaled = Math.round(iconSize * transform.scale);
    icon = icon.resize(scaled, scaled, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  const iconBuffer = await icon.png().toBuffer();
  const bg = await buildBackground(size, background, transform.borderRadius);

  const composited = await bg
    .composite([{ input: iconBuffer, gravity: 'centre' }])
    .png()
    .toBuffer();

  if (format === 'webp') {
    return sharp(composited).webp({ quality: 100, lossless: true }).toBuffer();
  }

  return composited;
}

async function buildBackground(size: number, background: Background, borderRadius: number): Promise<Sharp> {
  if (background.type === 'transparent') {
    return sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    });
  }

  if (background.type === 'solid') {
    const { r, g, b } = hexToRgb(toHex(background.color!));
    const base = sharp({
      create: { width: size, height: size, channels: 4, background: { r, g, b, alpha: 1 } },
    });
    if (borderRadius > 0) return applyBorderRadius(base, size, borderRadius);
    return base;
  }

  if (background.type === 'gradient') {
    const svg = buildGradientSvg(size, background.gradient!);
    const base = sharp(Buffer.from(svg));
    if (borderRadius > 0) return applyBorderRadius(base, size, borderRadius);
    return base;
  }

  throw new Error(`Unknown background type: ${(background as any).type}`);
}

async function applyBorderRadius(image: Sharp, size: number, radiusRatio: number): Promise<Sharp> {
  const radius = Math.round(size * radiusRatio);
  const mask = Buffer.from(
    `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
  );
  const buf = await image.png().toBuffer();
  return sharp(buf).composite([{ input: mask, blend: 'dest-in' }]);
}

function buildGradientSvg(size: number, gradient: NonNullable<Background['gradient']>): string {
  const stops = gradient.stops
    .map(s => `<stop offset="${s.position * 100}%" stop-color="${toHex(s.color)}"/>`)
    .join('');

  if (gradient.type === 'radial') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><radialGradient id="g">${stops}</radialGradient></defs>
      <rect width="${size}" height="${size}" fill="url(#g)"/>
    </svg>`;
  }

  const angle = gradient.angle ?? 135;
  const rad = (angle * Math.PI) / 180;
  const x2 = Math.round((0.5 + Math.cos(rad) * 0.5) * 100);
  const y2 = Math.round((0.5 + Math.sin(rad) * 0.5) * 100);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`;
}

function toHex(color: string): string {
  const hex = formatHex(parse(color)!);
  if (!hex) throw new Error(`Cannot convert color to hex: ${color}`);
  return hex;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
