#!/usr/bin/env node

const { Command } = require('commander');
const { run } = require('../dist/index');

const program = new Command();

program
  .name('doicon')
  .description('Generate iOS and Android app icons from a single source image')
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'Path to config file (default: doicon.config.json)')
  .option('--only <platform>', 'Generate only for a specific platform: ios | android')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('--verbose', 'Show each file as it is written')
  .action(async (options) => {
    try {
      await run({
        config: options.config,
        only: options.only,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    } catch (err) {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
