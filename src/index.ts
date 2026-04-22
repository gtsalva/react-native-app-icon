import { loadConfig, DoiconConfig } from './config';
import { generateIos } from './platforms/ios';
import { generateAndroid } from './platforms/android';

export { loadConfig, DoiconConfig };

export interface RunOptions {
  config?: string;
  only?: 'ios' | 'android';
  dryRun?: boolean;
  verbose?: boolean;
}

export async function run(options: RunOptions = {}): Promise<void> {
  const config = loadConfig(options.config);
  const opts = { dryRun: options.dryRun ?? false, verbose: options.verbose ?? false };

  console.log(`doicon — source: ${config.source}`);
  if (opts.dryRun) console.log('(dry run — no files will be written)');

  const runIos = !options.only || options.only === 'ios';
  const runAndroid = !options.only || options.only === 'android';

  if (runIos && config.ios !== undefined) {
    await generateIos(config, opts);
  } else if (runIos) {
    console.log('\niOS — skipped (not configured)');
  }

  if (runAndroid && config.android !== undefined) {
    await generateAndroid(config, opts);
  } else if (runAndroid) {
    console.log('\nAndroid — skipped (not configured)');
  }

  console.log('\nAll done.');
}
