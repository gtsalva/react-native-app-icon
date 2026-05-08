import * as fs from 'fs';
import * as path from 'path';
import { DoiconConfig } from '../config';
import { renderIcon } from '../utils/image';

const DENSITIES = [
  { density: 'mdpi',    size: 48  },
  { density: 'hdpi',    size: 72  },
  { density: 'xhdpi',   size: 96  },
  { density: 'xxhdpi',  size: 144 },
  { density: 'xxxhdpi', size: 192 },
] as const;

const PLAY_STORE_SIZE = 512;
const RES_BASE = 'android/app/src/main/res';
const PLAY_STORE_PATH = 'android/app/src/main/ic_launcher-playstore.png';

export async function generateAndroid(config: DoiconConfig, opts: { verbose: boolean; dryRun: boolean }): Promise<void> {
  const android = config.android!;
  const baseTransform = android.transform
    ? { ...config.transform, ...android.transform }
    : config.transform;
  const androidTransform = android.autoScale != null
    ? { ...baseTransform, scale: android.autoScale / (1 - 2 * config.transform.padding) }
    : baseTransform;
  const fmt = android.format ?? 'png';
  const useCustomSlug = !!android.appSlug;

  console.log(`\nAndroid — format: ${fmt}, naming: ${useCustomSlug ? `custom (android_${android.appSlug})` : 'default'}`);

  for (const { density, size } of DENSITIES) {
    const dir = path.resolve(process.cwd(), RES_BASE, `mipmap-${density}`);

    if (!fs.existsSync(dir)) {
      throw new Error(`Android res folder not found: ${dir}`);
    }

    // ic_launcher — legacy full icon with background
    await writeIcon({
      label: `mipmap-${density}/ic_launcher.${fmt}`,
      outPath: path.join(dir, `ic_launcher.${fmt}`),
      sourcePath: config.source,
      size,
      background: config.background,
      transform: androidTransform,
      format: fmt,
      opts,
    });

    // foreground layer for adaptive icon
    const foreground = android.adaptiveIcon?.foreground;
    const foregroundSource = foreground?.image
      ? path.resolve(process.cwd(), foreground.image)
      : config.source;

    const foregroundFilename = useCustomSlug
      ? `android_${android.appSlug}.${fmt}`
      : `ic_launcher_foreground.${fmt}`;

    await writeIcon({
      label: `mipmap-${density}/${foregroundFilename}`,
      outPath: path.join(dir, foregroundFilename),
      sourcePath: foregroundSource,
      size,
      background: config.background,
      transform: androidTransform,
      format: fmt,
      opts,
    });

    // ic_launcher_round — only when enabled
    if (android.round) {
      await writeIcon({
        label: `mipmap-${density}/ic_launcher_round.${fmt}`,
        outPath: path.join(dir, `ic_launcher_round.${fmt}`),
        sourcePath: config.source,
        size,
        background: config.background,
        transform: { ...androidTransform, borderRadius: 0.5 },
        format: fmt,
        opts,
      });
    }
  }

  // Play Store (always PNG regardless of format)
  await writeIcon({
    label: 'ic_launcher-playstore.png',
    outPath: path.resolve(process.cwd(), PLAY_STORE_PATH),
    sourcePath: config.source,
    size: PLAY_STORE_SIZE,
    background: config.background,
    transform: androidTransform,
    format: 'png',
    opts,
  });

  console.log(`  ✓ Android icons written to ${RES_BASE}`);
}

async function writeIcon(params: {
  label: string;
  outPath: string;
  sourcePath: string;
  size: number;
  background: DoiconConfig['background'];
  transform: DoiconConfig['transform'];
  format: 'png' | 'webp';
  opts: { verbose: boolean; dryRun: boolean };
}): Promise<void> {
  const { label, outPath, sourcePath, size, background, transform, format, opts } = params;

  if (opts.verbose) process.stdout.write(`  ${label} (${size}x${size})... `);

  if (!opts.dryRun) {
    const buffer = await renderIcon(sourcePath, { size, background, transform, format });
    fs.writeFileSync(outPath, buffer);
  }

  if (opts.verbose) console.log('done');
}
