import * as fs from 'fs';
import * as path from 'path';
import { DoiconConfig } from '../config';
import { renderIcon } from '../utils/image';

const IOS_SIZES = [
  16, 20, 29, 32, 40, 48, 50, 55, 57, 58, 60, 64, 66, 72, 76,
  80, 87, 88, 92, 100, 102, 108, 114, 120, 128, 144, 152, 167,
  172, 180, 196, 216, 234, 256, 258, 512, 1024,
];

function findAssetCatalog(): string {
  const iosDir = path.resolve(process.cwd(), 'ios');

  if (!fs.existsSync(iosDir)) {
    throw new Error(`ios/ folder not found in ${process.cwd()}`);
  }

  for (const appFolder of fs.readdirSync(iosDir)) {
    const candidate = path.join(iosDir, appFolder, 'Images.xcassets', 'AppIcon.appiconset');
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`Could not find AppIcon.appiconset inside ios/*/Images.xcassets/`);
}

export async function generateIos(config: DoiconConfig, opts: { verbose: boolean; dryRun: boolean }): Promise<void> {
  const outDir = findAssetCatalog();
  const relPath = path.relative(process.cwd(), outDir);
  const ios = config.ios;
  const iosTransform = ios?.autoScale != null
    ? { ...config.transform, scale: ios.autoScale / (1 - 2 * config.transform.padding) }
    : config.transform;

  console.log(`\niOS — ${IOS_SIZES.length} icons → ${relPath}`);

  for (const size of IOS_SIZES) {
    const filename = `${size}.png`;
    const outPath = path.join(outDir, filename);

    if (opts.verbose) process.stdout.write(`  ${filename} (${size}x${size})... `);

    if (!opts.dryRun) {
      const buffer = await renderIcon(config.source, {
        size,
        background: config.background,
        transform: iosTransform,
      });
      fs.writeFileSync(outPath, buffer);
    }

    if (opts.verbose) console.log('done');
  }

  console.log(`  ✓ iOS icons written to ${relPath}`);
}
